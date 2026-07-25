// app/actions/course-completion.ts
'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { sendTextbeeSms } from '@/lib/textbee'
import { logAudit } from '@/lib/audit'

/**
 * Fetch all enrollments with PENDING_COMPLETION status (awaiting admin action).
 */
export async function getPendingCompletions() {
  const enrollments = await prisma.enrollment.findMany({
    where: { status: 'PENDING_COMPLETION' },
    include: {
      student: true,
      courseOnSlot: {
        include: {
          course: true,
          slot: { include: { room: true } },
        },
      },
    },
    orderBy: { endDate: 'asc' },
  })

  return enrollments
}

/**
 * Fetch all completed enrollments (historical record).
 */
export async function getCompletedEnrollments() {
  const enrollments = await prisma.enrollment.findMany({
    where: { status: 'COMPLETED' },
    include: {
      student: true,
      courseOnSlot: {
        include: {
          course: true,
          slot: { include: { room: true } },
        },
      },
    },
    orderBy: { completedAt: 'desc' },
  })

  return enrollments
}

/**
 * Mark an enrollment as COMPLETED. This vacates the seat.
 */
export async function markAsCompleted(formData: FormData) {
  const enrollmentId = formData.get('enrollmentId') as string

  if (!enrollmentId) {
    return { success: false, error: 'Missing enrollment ID' }
  }

  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
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

    if (!enrollment) {
      return { success: false, error: 'Enrollment not found' }
    }

    if (enrollment.status !== 'PENDING_COMPLETION') {
      return { success: false, error: 'Only pending enrollments can be marked as completed' }
    }

    // Mark as completed
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    })

    // Send congratulations SMS
    const courseName = enrollment.courseOnSlot.course.name
    if (enrollment.student.phone) {
      const message = `Congratulations ${enrollment.student.name}! You have successfully completed the ${courseName} course at Shams Commercial Institute. We wish you the best in your future endeavors!`
      
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
    }

    // Audit log
    await logAudit({
      action: 'ENROLLMENT_COMPLETED',
      entity: 'Enrollment',
      entityId: enrollmentId,
      details: {
        studentName: enrollment.student.name,
        courseName,
        completedAt: new Date().toISOString(),
      },
    })

    revalidatePath('/admin/completed-students')
    revalidatePath('/admin/enrollment')
    revalidatePath(`/admin/students/${enrollment.studentId}`)
    revalidatePath('/admin')

    return { success: true, message: `${enrollment.student.name} marked as completed for ${courseName}. Seat has been vacated.` }
  } catch (error) {
    console.error('Mark Completed Error:', error)
    return { success: false, error: 'Failed to mark as completed' }
  }
}

/**
 * Extend a PENDING_COMPLETION enrollment — reactivates it with additional months.
 */
export async function extendAndReactivate(formData: FormData) {
  const enrollmentId = formData.get('enrollmentId') as string
  const additionalMonthsRaw = formData.get('additionalMonths') as string
  const additionalMonths = parseInt(additionalMonthsRaw)

  if (!enrollmentId || !additionalMonths || additionalMonths <= 0) {
    return { success: false, error: 'Invalid enrollment ID or months' }
  }

  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        student: true,
        courseOnSlot: {
          include: { course: true, slot: { include: { room: true } } },
        },
      },
    })

    if (!enrollment) {
      return { success: false, error: 'Enrollment not found' }
    }

    if (enrollment.status !== 'PENDING_COMPLETION') {
      return { success: false, error: 'Only pending enrollments can be extended' }
    }

    // Calculate new end date from today + additional months
    const now = new Date()
    const newEndDate = new Date(now)
    newEndDate.setMonth(newEndDate.getMonth() + additionalMonths)

    // Reactivate and extend
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status: 'ACTIVE',
        endDate: newEndDate,
        extendedDays: (enrollment.extendedDays || 0) + (additionalMonths * 30),
      },
    })

    // Generate a new fee for the current month
    const cycleDate = new Date(now.getFullYear(), now.getMonth(), 1)
    const existingFee = await prisma.fee.findFirst({
      where: {
        enrollmentId,
        cycleDate,
      },
    })

    if (!existingFee) {
      const courseFee = enrollment.courseOnSlot.course.baseFee
      await prisma.fee.create({
        data: {
          studentId: enrollment.studentId,
          enrollmentId,
          amount: courseFee,
          discountAmount: 0,
          finalAmount: courseFee,
          rolloverAmount: 0,
          dueDate: now,
          cycleDate,
          status: 'UNPAID',
        },
      })
    }

    // Audit log
    await logAudit({
      action: 'ENROLLMENT_EXTENDED',
      entity: 'Enrollment',
      entityId: enrollmentId,
      details: {
        studentName: enrollment.student.name,
        courseName: enrollment.courseOnSlot.course.name,
        additionalMonths,
        newEndDate: newEndDate.toISOString(),
      },
    })

    // Send SMS about extension
    if (enrollment.student.phone) {
      const message = `Dear ${enrollment.student.name}, your ${enrollment.courseOnSlot.course.name} course at Shams Commercial Institute has been extended by ${additionalMonths} month(s). New end date: ${newEndDate.toLocaleDateString('en-PK')}.`
      await sendTextbeeSms(enrollment.student.phone, message)
    }

    revalidatePath('/admin/completed-students')
    revalidatePath('/admin/enrollment')
    revalidatePath(`/admin/students/${enrollment.studentId}`)
    revalidatePath('/admin')

    return {
      success: true,
      message: `${enrollment.student.name}'s course extended by ${additionalMonths} month(s). Status changed back to ACTIVE.`,
    }
  } catch (error) {
    console.error('Extend Error:', error)
    return { success: false, error: 'Failed to extend enrollment' }
  }
}
