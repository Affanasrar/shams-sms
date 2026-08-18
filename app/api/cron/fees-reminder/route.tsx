// app/api/cron/fees-reminder/route.tsx
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generateFeeVoucherPdfBuffer } from '@/lib/pdf-helpers'
import { sendSmartMessage, sendSmartDocument } from '@/lib/messaging'

function getWeekString(date: Date): string {
 const year = date.getFullYear()
 const startOfYear = new Date(year, 0, 1)
 const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000))
 const week = Math.ceil((days + startOfYear.getDay() + 1) / 7)
 return `${year}-W${week.toString().padStart(2, '0')}`
}

export async function GET(request: NextRequest) {
 // 🔒 Verify cron secret to prevent unauthorized access
 const authHeader = request.headers.get('authorization')
 if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
 console.warn('⚠️ Unauthorized cron job access attempt on /api/cron/fees-reminder')
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 }

 try {
 console.log('⏳ Daily Fee Reminder Cron Started: checking unpaid fees and sending smart vouchers/reminders...')

 const now = new Date()
 const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
 const todayString = today.toISOString().split('T')[0]
 const currentWeek = getWeekString(today)

 const overdueFees = await prisma.fee.findMany({
 where: {
 status: { in: ['UNPAID', 'PARTIAL'] },
 dueDate: { lte: today },
 // ✅ Only send reminders for fees tied to ACTIVE enrollments.
 // Dropped/completed students retain unpaid fee records in the DB,
 // so we must explicitly exclude them here.
 enrollment: {
 status: 'ACTIVE'
 },
 student: {
 smsReminderEnabled: true
 }
 },
 include: {
 student: true,
 enrollment: {
 include: {
 courseOnSlot: {
 include: {
 course: true,
 slot: { include: { room: true } }
 }
 }
 }
 }
 },
 orderBy: {
 dueDate: 'asc'
 }
 })

 console.log(`📊 Found ${overdueFees.length} unpaid/overdue fee records as of ${todayString}`)

 const feesByStudent = new Map<string, { student: { id: string; name: string; fatherName: string; studentId: string; phone: string }; fees: Array<typeof overdueFees[number]> }>()

 for (const fee of overdueFees) {
 const studentId = fee.student.id
 const existing = feesByStudent.get(studentId)

 if (existing) {
 existing.fees.push(fee)
 } else {
 feesByStudent.set(studentId, {
 student: {
 id: fee.student.id,
 name: fee.student.name,
 fatherName: fee.student.fatherName,
 studentId: fee.student.studentId,
 phone: fee.student.phone
 },
 fees: [fee]
 })
 }
 }

 const reminderResults: Array<{ studentId: string; studentName: string; success: boolean; skipped: boolean; feeIds: string[]; outstandingAmount: number; weeklyReminderCount: number; error?: string }> = []
 let remindersSent = 0
 let remindersFailed = 0
 let remindersSkipped = 0

 for (const entry of feesByStudent.values()) {
 const { student, fees } = entry
 const feeIds = fees.map(f => f.id)
 const primaryFee = fees[0]
 const totalOutstanding = fees.reduce((sum, fee) => {
 return sum + (Number(fee.finalAmount) - Number(fee.paidAmount))
 }, 0)

 const earliestDueDate = fees.reduce((earliest, fee) => {
 return fee.dueDate < earliest ? fee.dueDate : earliest
 }, fees[0].dueDate)

 const isFirstDayDue = earliestDueDate.toDateString() === today.toDateString()
 const dueDateString = earliestDueDate.toISOString().split('T')[0]

 const message = `Dear ${student.name},

You have outstanding fees of PKR ${totalOutstanding} due on ${dueDateString}. Please make the payment immediately to avoid penalties.

Student ID: ${student.studentId}

Regards,
Finance Department
Shams Commercial Institute`

 let status = 'SKIPPED'
 let errorMessage: string | null = null
 let success = false
 let skipped = false

 if (!student.phone) {
 skipped = true
 status = 'SKIPPED'
 errorMessage = 'No phone number available'
 console.log(`⚠️ Skipping fee reminder for ${student.name} (${student.studentId}): no phone number.`)

 await prisma.smsMessage.create({
 data: {
 studentId: student.id,
 phoneNumber: student.phone || '',
 message,
 direction: 'OUTBOUND',
 status: 'FAILED',
 textbeeId: null,
 errorMsg: errorMessage,
 sentAt: null
 }
 })
 } else {
 let msgResponse

 // If today is the very first day due, generate and send the PDF Voucher!
 if (isFirstDayDue && primaryFee) {
 try {
 const cycleMonth = new Date(primaryFee.cycleDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'Asia/Karachi' })
 const courseName = primaryFee.enrollment?.courseOnSlot?.course?.name || 'Course Fee'
 const slot = primaryFee.enrollment?.courseOnSlot?.slot
 const formatTime = (d: Date) => new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })
 const timingStr = slot ? `${slot.days} (${formatTime(slot.startTime)} - ${formatTime(slot.endTime)})` : 'Scheduled Timing'
 const roomName = slot?.room?.name || 'Classroom'

 const pdfBuffer = await generateFeeVoucherPdfBuffer({
 voucherNo: `VCH-${primaryFee.id.slice(0, 8).toUpperCase()}`,
 issueDate: todayString,
 dueDate: dueDateString,
 cycleMonth: cycleMonth,
 student: {
 studentId: student.studentId,
 name: student.name,
 fatherName: student.fatherName,
 phone: student.phone,
 },
 course: {
 name: courseName,
 timing: timingStr,
 room: roomName,
 },
 financials: {
 baseAmount: Number(primaryFee.amount),
 discountAmount: Number(primaryFee.discountAmount || 0),
 rolloverAmount: Number(primaryFee.rolloverAmount || 0),
 finalAmount: Number(primaryFee.finalAmount),
 paidAmount: Number(primaryFee.paidAmount),
 remainingAmount: totalOutstanding,
 },
 institution: {
 name: 'Shams Commercial Institute',
 address: 'Main Campus, Commercial Area',
 phone: '+92 300 1234567',
 },
 })
 const fileName = `Fee_Voucher_${student.studentId}_${cycleMonth.replace(/\s+/g, '_')}.pdf`
 const caption = `Dear ${student.name}, attached is your official Fee Voucher for ${cycleMonth}. Net Balance Due: PKR ${totalOutstanding.toLocaleString()}. Due Date: ${dueDateString}. Please pay on time. - Shams Commercial Institute`

 msgResponse = await sendSmartDocument(student.phone, pdfBuffer, fileName, caption)
 } catch (pdfErr) {
 console.error(`PDF generation error for ${student.name}:`, pdfErr)
 msgResponse = await sendSmartMessage(student.phone, message, 'SMART')
 }
 } else {
 // Regular text reminder for ongoing overdue days
 msgResponse = await sendSmartMessage(student.phone, message, 'SMART')
 }

 const finalStatus = msgResponse.success ? 'SENT' : 'FAILED'

 status = finalStatus
 success = msgResponse.success

 if (msgResponse.success) {
 remindersSent++
 console.log(`✅ Smart fee reminder sent via ${msgResponse.channelUsed} to ${student.name} (${student.phone})`)
 } else {
 remindersFailed++
 errorMessage = msgResponse.error || 'Smart message dispatch failed'
 console.error(`❌ Failed to send smart fee reminder to ${student.name} (${student.phone}): ${errorMessage}`)
 }

 await prisma.smsMessage.create({
 data: {
 studentId: student.id,
 phoneNumber: student.phone,
 message: isFirstDayDue ? `[PDF Fee Voucher] ${message}` : message,
 direction: 'OUTBOUND',
 status: finalStatus,
 textbeeId: msgResponse.id || null,
 errorMsg: errorMessage,
 sentAt: msgResponse.success ? new Date() : null
 }
 })
 }

 if (skipped) {
 remindersSkipped++
 }

 await prisma.feeReminderLog.create({
 data: {
 studentId: student.id,
 feeIds,
 status,
 details: message,
 error: errorMessage ?? undefined,
 week: currentWeek
 }
 })

 const weeklyReminderCount = await prisma.feeReminderLog.count({
 where: {
 studentId: student.id,
 status: 'SENT',
 week: currentWeek
 }
 })

 reminderResults.push({
 studentId: student.id,
 studentName: student.name,
 success,
 skipped,
 feeIds,
 outstandingAmount: totalOutstanding,
 weeklyReminderCount,
 error: errorMessage ?? undefined
 })
 }

 console.log(`🎉 Fee Reminder Cron Completed: ${remindersSent} reminders sent, ${remindersFailed} failed, ${remindersSkipped} skipped`) 

 return NextResponse.json({
 success: true,
 date: todayString,
 remindersSent,
 remindersFailed,
 remindersSkipped,
 totalStudentsProcessed: feesByStudent.size,
 results: reminderResults
 })
 } catch (error) {
 console.error('❌ Fee Reminder Cron failed:', error)
 return NextResponse.json({
 success: false,
 error: 'Fee reminder cron failed',
 details: error instanceof Error ? error.message : 'Unknown error'
 }, { status: 500 })
 }
}
