// app/api/cron/fees-reminder/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendTextbeeSms } from '@/lib/textbee'

export async function GET() {
  try {
    console.log('⏳ Daily Fee Reminder Cron Started: checking unpaid fees and sending SMS reminders...')

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayString = today.toISOString().split('T')[0]

    const overdueFees = await prisma.fee.findMany({
      where: {
        status: { in: ['UNPAID', 'PARTIAL'] },
        dueDate: { lte: today }
      },
      include: {
        student: true
      },
      orderBy: {
        dueDate: 'asc'
      }
    })

    console.log(`📊 Found ${overdueFees.length} unpaid/overdue fee records as of ${todayString}`)

    const feesByStudent = new Map<string, { student: { id: string; name: string; studentId: string; phone: string }; fees: Array<{ id: string; finalAmount: string; paidAmount: string; dueDate: Date }> }>()

    for (const fee of overdueFees) {
      const studentId = fee.student.id
      const existing = feesByStudent.get(studentId)

      if (existing) {
        existing.fees.push({
          id: fee.id,
          finalAmount: fee.finalAmount.toString(),
          paidAmount: fee.paidAmount.toString(),
          dueDate: fee.dueDate
        })
      } else {
        feesByStudent.set(studentId, {
          student: {
            id: fee.student.id,
            name: fee.student.name,
            studentId: fee.student.studentId,
            phone: fee.student.phone
          },
          fees: [{
            id: fee.id,
            finalAmount: fee.finalAmount.toString(),
            paidAmount: fee.paidAmount.toString(),
            dueDate: fee.dueDate
          }]
        })
      }
    }

    const reminderResults: Array<{ studentId: string; studentName: string; success: boolean; skipped: boolean; feeIds: string[]; outstandingAmount: number; error?: string }> = []
    let remindersSent = 0
    let remindersSkipped = 0

    for (const entry of feesByStudent.values()) {
      const { student, fees } = entry
      const feeIds = fees.map(f => f.id)
      const totalOutstanding = fees.reduce((sum, fee) => {
        return sum + (Number(fee.finalAmount) - Number(fee.paidAmount))
      }, 0)

      const earliestDueDate = fees.reduce((earliest, fee) => {
        return fee.dueDate < earliest ? fee.dueDate : earliest
      }, fees[0].dueDate)
      const dueDateString = earliestDueDate.toISOString().split('T')[0]

      const message = `Dear ${student.name}, you have unpaid fees of PKR ${totalOutstanding} due on ${dueDateString}. Please pay immediately to avoid penalties. Student ID: ${student.studentId}.`

      let status = 'SKIPPED'
      let errorMessage: string | null = null
      let success = false
      let skipped = false

      if (!student.phone) {
        skipped = true
        status = 'SKIPPED'
        errorMessage = 'No phone number available'
        console.log(`⚠️ Skipping SMS for ${student.name} (${student.studentId}): no phone number.`)
      } else {
        const smsSent = await sendTextbeeSms(student.phone, message)
        if (smsSent) {
          status = 'SENT'
          success = true
          remindersSent++
          console.log(`✅ SMS reminder sent to ${student.name} (${student.phone}) for outstanding PKR ${totalOutstanding}`)
        } else {
          status = 'FAILED'
          errorMessage = 'Textbee SMS send failed'
          console.error(`❌ Failed to send SMS reminder to ${student.name} (${student.phone})`)
        }
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
          error: errorMessage ?? undefined
        }
      })

      reminderResults.push({
        studentId: student.id,
        studentName: student.name,
        success,
        skipped,
        feeIds,
        outstandingAmount: totalOutstanding,
        error: errorMessage ?? undefined
      })
    }

    console.log(`🎉 Fee Reminder Cron Completed: ${remindersSent} reminders sent, ${remindersSkipped} skipped, ${feesByStudent.size - remindersSent - remindersSkipped} failed`) 

    return NextResponse.json({
      success: true,
      date: todayString,
      remindersSent,
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
