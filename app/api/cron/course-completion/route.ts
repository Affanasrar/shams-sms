// app/api/cron/course-completion/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendTextbeeSms } from '@/lib/textbee'
import { logAudit } from '@/lib/audit'

export async function GET(request: NextRequest) {
  // Verify CRON_SECRET for production security
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = request.headers.get('Authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const now = new Date()

    // Find all ACTIVE enrollments where endDate has passed
    const expiredEnrollments = await prisma.enrollment.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          lte: now,
        },
      },
      include: {
        student: true,
        courseOnSlot: {
          include: {
            course: true,
            slot: { include: { room: true } },
          },
        },
      },
    })

    if (expiredEnrollments.length === 0) {
      return NextResponse.json({
        message: 'No enrollments to mark as pending completion',
        processed: 0,
      })
    }

    let processed = 0
    let smsCount = 0
    const errors: string[] = []

    for (const enrollment of expiredEnrollments) {
      try {
        // Change status to PENDING_COMPLETION
        await prisma.enrollment.update({
          where: { id: enrollment.id },
          data: { status: 'PENDING_COMPLETION' },
        })

        // Log audit
        await logAudit({
          action: 'ENROLLMENT_PENDING_COMPLETION',
          entity: 'Enrollment',
          entityId: enrollment.id,
          details: {
            studentName: enrollment.student.name,
            courseName: enrollment.courseOnSlot.course.name,
            endDate: enrollment.endDate?.toISOString(),
            reason: 'Course duration ended (automated cron)',
          },
        })

        // Send SMS notification
        if (enrollment.student.phone && enrollment.student.smsReminderEnabled) {
          const message = `Dear ${enrollment.student.name}, your ${enrollment.courseOnSlot.course.name} course at Shams Commercial Institute has been completed. Please contact the institute if you wish to extend your course duration.`
          
          const smsResponse = await sendTextbeeSms(enrollment.student.phone, message)
          
          const validStatuses = ['PENDING', 'SENT', 'DELIVERED', 'FAILED'] as const
          const finalStatus = smsResponse.success
            ? (smsResponse.status && validStatuses.includes(smsResponse.status) ? smsResponse.status : 'SENT')
            : 'FAILED'

          await prisma.smsMessage.create({
            data: {
              studentId: enrollment.student.id,
              phoneNumber: enrollment.student.phone,
              message,
              direction: 'OUTBOUND',
              status: finalStatus,
              textbeeId: smsResponse.textbeeId || null,
              errorMsg: smsResponse.error || null,
              sentAt: smsResponse.success ? new Date() : null,
            },
          })

          if (smsResponse.success) smsCount++
        }

        processed++
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        errors.push(`Enrollment ${enrollment.id}: ${msg}`)
        console.error(`[Course Completion Cron] Error for enrollment ${enrollment.id}:`, err)
      }
    }

    return NextResponse.json({
      message: `Processed ${processed} enrollments`,
      processed,
      smsSent: smsCount,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('[Course Completion Cron] Fatal error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
