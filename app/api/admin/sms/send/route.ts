// app/api/admin/sms/send/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { sendSmartMessage, PreferredChannel } from '@/lib/messaging'
import { verifyAdminApiRole } from '@/lib/auth-utils'

const BulkSmsSchema = z.object({
 studentIds: z.array(z.string().uuid()).min(1, 'At least one student must be selected'),
 customMessage: z.string().optional().default(''),
 channel: z.enum(['SMART', 'WHATSAPP', 'SMS']).optional().default('SMART')
})

export async function POST(request: Request) {
 try {
 const { isAdmin } = await verifyAdminApiRole()
 if (!isAdmin) {
 return NextResponse.json(
 { error: 'Forbidden - Admin access required' },
 { status: 403 }
 )
 }

 const body = await request.json()
 const parsed = BulkSmsSchema.safeParse(body)

 if (!parsed.success) {
 return NextResponse.json(
 {
 error: 'Invalid request data',
 details: parsed.error.issues.map(issue => ({
 field: issue.path.join('.'),
 message: issue.message
 }))
 },
 { status: 400 }
 )
 }

 const studentIds = Array.from(new Set(parsed.data.studentIds))
 const customMessage = parsed.data.customMessage.trim()
 const preferredChannel = parsed.data.channel as PreferredChannel

 if (studentIds.length === 0) {
 return NextResponse.json(
 { error: 'At least one student must be selected' },
 { status: 400 }
 )
 }

 // Fetch selected students with their enrollments and fees
 const students = await prisma.student.findMany({
 where: {
 id: { in: studentIds }
 },
 include: {
 enrollments: {
 where: { status: 'ACTIVE' },
 include: {
 courseOnSlot: {
 include: {
 course: true
 }
 },
 fees: {
 where: {
 status: { in: ['UNPAID', 'PARTIAL'] }
 },
 orderBy: {
 dueDate: 'desc'
 }
 }
 }
 }
 }
 })

 const results = []

 for (const student of students) {
 try {
 const allFees = student.enrollments.flatMap(enrollment => enrollment.fees || [])
 const recentFee = allFees.sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime())[0]
 const totalOutstanding = allFees.reduce((sum, fee) => sum + Number(fee.finalAmount), 0)
 const primaryCourse = student.enrollments[0]?.courseOnSlot?.course?.name || 'Enrolled Course'
 const dueDateStr = recentFee ? recentFee.dueDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
 const feeAmount = recentFee ? Number(recentFee.finalAmount) : totalOutstanding
 const todayStr = new Date().toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Asia/Karachi' })

 let message = ''

 if (customMessage.length > 0) {
 // Use custom message with comprehensive placeholder replacement
 message = customMessage
 .replace(/\[Student Name\]/g, student.name)
 .replace(/\[Student ID\]/g, student.studentId)
 .replace(/\[Father Name\]/g, student.fatherName || '')
 .replace(/\[Course\]/g, primaryCourse)
 .replace(/\[Amount\]/g, feeAmount.toLocaleString())
 .replace(/\[Due Date\]/g, dueDateStr)
 .replace(/\[Date\]/g, todayStr)
 } else {
 // Generate clean, premium due-date reminder message
 if (!recentFee) {
 results.push({
 studentId: student.id,
 success: false,
 message: 'No unpaid fees found'
 })
 continue
 }

 message = `*SHAMS COMMERCIAL INSTITUTE — FEE REMINDER*

Dear *${student.name}* (${student.studentId}),

This is a reminder regarding your fee payment:

• *Course:* ${primaryCourse}
• *Payable Amount:* PKR ${feeAmount.toLocaleString()}
• *Total Outstanding:* PKR ${totalOutstanding.toLocaleString()}
• *Due Date:* ${dueDateStr}

Kindly clear the outstanding dues at the accounts office.

Accounts Department
Shams Commercial Institute`
 }

 if (!student.phone) {
 results.push({
 studentId: student.id,
 success: false,
 message: 'No phone number available'
 })
 continue
 }

 const msgResponse = await sendSmartMessage(student.phone, message, preferredChannel)
 const finalStatus = msgResponse.success ? 'SENT' : 'FAILED'

 await prisma.smsMessage.create({
 data: {
 studentId: student.id,
 phoneNumber: student.phone,
 message,
 direction: 'OUTBOUND',
 status: finalStatus,
 textbeeId: msgResponse.id || null,
 errorMsg: msgResponse.error || null,
 sentAt: msgResponse.success ? new Date() : null
 }
 })

 const channelLabel = msgResponse.channelUsed === 'WHATSAPP'
 ? 'WhatsApp'
 : msgResponse.channelUsed === 'SMS_FALLBACK'
 ? 'SMS (Fallback)'
 : 'SMS'

 results.push({
 studentId: student.id,
 success: msgResponse.success,
 message: msgResponse.success
 ? `Message sent via ${channelLabel}`
 : `Failed: ${msgResponse.error || 'Unknown error'}`
 })

 } catch (error) {
 console.error(`Error sending SMS to ${student.name}:`, error)
 results.push({
 studentId: student.id,
 success: false,
 message: 'Error occurred while sending SMS'
 })
 }
 }

 return NextResponse.json({
 success: true,
 results
 })

 } catch (error) {
 console.error('SMS send API error:', error)
 return NextResponse.json(
 { error: 'Internal server error' },
 { status: 500 }
 )
 }
}