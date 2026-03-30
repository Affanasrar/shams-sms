// lib/course-fees.ts
import prisma from './prisma'

/**
 * Get the appropriate fee for a student based on their enrollment date
 * New students pay the current fee, existing students pay the fee from when they enrolled
 */
export async function getFeeForStudent(enrollmentId: string): Promise<number> {
  // Get enrollment with joining date
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    select: {
      joiningDate: true,
      courseOnSlot: {
        select: {
          courseId: true
        }
      }
    }
  })

  if (!enrollment) {
    throw new Error('Enrollment not found')
  }

  const joiningDate = enrollment.joiningDate
  const courseId = enrollment.courseOnSlot.courseId

  // Get the most recent fee change that happened before or on the joining date
  const relevantFeeHistory = await prisma.courseFeeHistory.findFirst({
    where: {
      courseId: courseId,
      changedAt: {
        lte: joiningDate
      }
    },
    orderBy: { changedAt: 'desc' }
  })

  // If there's a fee history record BEFORE or ON joining, use that rate
  if (relevantFeeHistory) {
    return Number(relevantFeeHistory.newFee)
  }

  // If no history before joining, use the fee at the time of first recorded change (oldFee)
  const firstChange = await prisma.courseFeeHistory.findFirst({
    where: { courseId },
    orderBy: { changedAt: 'asc' }
  })

  if (firstChange) {
    return Number(firstChange.oldFee)
  }

  // Otherwise fallback to current course fee
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { baseFee: true }
  })

  if (!course) {
    throw new Error('Course not found')
  }

  return Number(course.baseFee)
}

/**
 * Get the current fee for a course (for new enrollments)
 */
export async function getCurrentFeeForCourse(courseId: string): Promise<number> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { baseFee: true }
  })

  if (!course) {
    throw new Error('Course not found')
  }

  return Number(course.baseFee)
}