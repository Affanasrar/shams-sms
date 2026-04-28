// app/actions/dropped-students.ts
'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getCurrentFeeForCourse } from '@/lib/course-fees'

/**
 * Re-enroll a dropped student
 * Changes status from DROPPED back to ACTIVE
 * Optionally creates new fees if they want to continue
 */
export async function reEnrollStudent(
  enrollmentId: string,
  options?: {
    extendDays?: number
  }
) {
  console.log(`⚡ Re-enrolling student in enrollment ${enrollmentId}`)

  return await prisma.$transaction(async (tx) => {
    // Get the enrollment details
    const enrollment = await tx.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        student: true,
        courseOnSlot: {
          include: { course: true }
        }
      }
    })

    if (!enrollment) {
      throw new Error('Enrollment not found')
    }

    if (enrollment.status !== 'DROPPED') {
      throw new Error('Only dropped enrollments can be re-enrolled')
    }

    // Calculate new end date
    const today = new Date()
    let newEndDate = new Date(today)
    
    if (options?.extendDays) {
      newEndDate.setDate(newEndDate.getDate() + options.extendDays)
    } else {
      // Default: extend by course duration
      newEndDate.setMonth(newEndDate.getMonth() + enrollment.courseOnSlot.course.durationMonths)
    }

    // Update enrollment status and dates
    const updatedEnrollment = await tx.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status: 'ACTIVE',
        endDate: newEndDate,
        extendedDays: (enrollment.extendedDays || 0) + (options?.extendDays || 0)
      }
    })

    // Create a new fee for the new enrollment period
    const currentFee = await getCurrentFeeForCourse(enrollment.courseOnSlot.courseId)
    const cycleDate = new Date(today.getFullYear(), today.getMonth(), 1)

    await tx.fee.create({
      data: {
        studentId: enrollment.studentId,
        enrollmentId: enrollmentId,
        amount: currentFee,
        discountAmount: 0,
        finalAmount: currentFee,
        rolloverAmount: 0,
        dueDate: today,
        cycleDate: cycleDate,
        status: 'UNPAID'
      }
    })

    console.log(`✅ Student re-enrolled successfully`)
    return updatedEnrollment
  })
}

/**
 * Extend a dropped student's enrollment period without changing status
 * This allows extending the endDate for consideration
 */
export async function extendDroppedStudent(
  enrollmentId: string,
  extendDays: number
) {
  console.log(`⚡ Extending dropped student enrollment ${enrollmentId} by ${extendDays} days`)

  return await prisma.$transaction(async (tx) => {
    const enrollment = await tx.enrollment.findUnique({
      where: { id: enrollmentId }
    })

    if (!enrollment) {
      throw new Error('Enrollment not found')
    }

    // Update endDate and extendedDays
    const newEndDate = new Date(enrollment.endDate || new Date())
    newEndDate.setDate(newEndDate.getDate() + extendDays)

    const updatedEnrollment = await tx.enrollment.update({
      where: { id: enrollmentId },
      data: {
        endDate: newEndDate,
        extendedDays: (enrollment.extendedDays || 0) + extendDays
      }
    })

    console.log(`✅ Dropped student extension recorded`)
    return updatedEnrollment
  })
}

/**
 * Get summary stats for dropped students
 */
export async function getDroppedStudentsStats() {
  const stats = await prisma.enrollment.aggregate({
    where: { status: 'DROPPED' },
    _count: true
  })

  const byMonth = await prisma.enrollment.groupBy({
    by: ['endDate'],
    where: { status: 'DROPPED' },
    _count: true,
    orderBy: {
      endDate: 'desc'
    }
  })

  return {
    totalDropped: stats._count,
    byMonth: byMonth.map(m => ({
      date: m.endDate,
      count: m._count
    }))
  }
}

revalidatePath('/admin/dropped-students')
