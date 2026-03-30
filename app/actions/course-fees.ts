// app/actions/course-fees.ts
'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { auth } from '@clerk/nextjs/server'

export async function updateCourseFee(prevState: any, formData: FormData) {
  const courseId = formData.get('courseId') as string
  const newFeeStr = formData.get('newFee') as string
  const newFee = parseFloat(newFeeStr)
  try {
    // Get current user (admin)
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      throw new Error('Unauthorized')
    }

    const admin = await prisma.user.findUnique({
      where: { clerkId }
    })

    if (!admin || admin.role !== 'ADMIN') {
      throw new Error('Admin access required')
    }

    // Get current course fee
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      throw new Error('Course not found')
    }

    const oldFee = course.baseFee

    // Only update if fee actually changed
    if (Number(oldFee) === newFee) {
      return { success: true, message: 'Fee unchanged' }
    }

    // Start transaction to update course fee and create history record
    await prisma.$transaction(async (tx) => {
      await tx.course.update({
        where: { id: courseId },
        data: { baseFee: newFee }
      })

      await tx.courseFeeHistory.create({
        data: {
          courseId,
          oldFee,
          newFee,
          changedById: admin.id
        }
      })
    })

    // Revalidate paths
    revalidatePath('/admin/courses')
    revalidatePath('/admin/fees')

    return {
      success: true,
      message: `Course fee updated from PKR ${Number(oldFee)} to PKR ${newFee}`
    }

  } catch (error) {
    console.error('Update course fee error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update course fee'
    }
  }
}

export async function getCourseFeeHistory(courseId: string) {
  try {
    const history = await prisma.courseFeeHistory.findMany({
      where: { courseId },
      include: {
        changedBy: {
          select: { firstName: true, lastName: true, email: true }
        }
      },
      orderBy: { changedAt: 'desc' }
    })

    return { success: true, history }
  } catch (error) {
    console.error('Get course fee history error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get fee history'
    }
  }
}