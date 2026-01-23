// app/actions/discount.ts
'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const DiscountSchema = z.object({
  enrollmentId: z.string(),
  discountAmount: z.string().transform(v => parseFloat(v)),
  discountType: z.enum(['FIXED', 'PERCENTAGE']),
  discountDuration: z.enum(['SINGLE_MONTH', 'ENTIRE_COURSE']),
  applicableFromMonth: z.string().transform(v => parseInt(v))
})

export async function applyStudentDiscount(prevState: any, formData: FormData) {
  const rawData = {
    enrollmentId: formData.get('enrollmentId'),
    discountAmount: formData.get('discountAmount'),
    discountType: formData.get('discountType'),
    discountDuration: formData.get('discountDuration'),
    applicableFromMonth: formData.get('applicableFromMonth')
  }

  const validated = DiscountSchema.safeParse(rawData)
  
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message }
  }

  try {
    // Get the enrollment to extract studentId and course duration
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: validated.data.enrollmentId },
      include: { courseOnSlot: { include: { course: true } } }
    })

    if (!enrollment) {
      return { success: false, error: 'Enrollment not found' }
    }

    const courseDuration = enrollment.courseOnSlot.course.durationMonths
    const applicableToMonth = validated.data.discountDuration === 'ENTIRE_COURSE' 
      ? courseDuration 
      : validated.data.applicableFromMonth

    // Create the discount
    const discount = await prisma.studentDiscount.create({
      data: {
        studentId: enrollment.studentId,
        enrollmentId: validated.data.enrollmentId,
        discountAmount: validated.data.discountAmount,
        discountType: validated.data.discountType as 'FIXED' | 'PERCENTAGE',
        discountDuration: validated.data.discountDuration as 'SINGLE_MONTH' | 'ENTIRE_COURSE',
        applicableFromMonth: validated.data.applicableFromMonth,
        applicableToMonth: applicableToMonth
      }
    })

    // Now update the fees for affected months
    const affectedFees = await prisma.fee.findMany({
      where: {
        enrollmentId: validated.data.enrollmentId,
        cycleDate: {
          gte: new Date(new Date().getFullYear(), validated.data.applicableFromMonth - 1, 1),
          lte: new Date(new Date().getFullYear(), applicableToMonth, 0)
        }
      }
    })

    for (const fee of affectedFees) {
      let discountAmount = 0
      
      if (validated.data.discountType === 'FIXED') {
        discountAmount = validated.data.discountAmount
      } else {
        // Percentage discount
        discountAmount = Number(fee.amount) * (validated.data.discountAmount / 100)
      }

      const finalAmount = Number(fee.amount) - discountAmount

      await prisma.fee.update({
        where: { id: fee.id },
        data: {
          discountId: discount.id,
          discountAmount: discountAmount,
          finalAmount: finalAmount
        }
      })
    }

  } catch (error: any) {
    console.error('Discount error:', error)
    return { success: false, error: 'Failed to apply discount' }
  }

  revalidatePath('/admin/fees')
  revalidatePath('/admin/fees/by-course')
  return { success: true }
}

export async function removeStudentDiscount(discountId: string) {
  try {
    const discount = await prisma.studentDiscount.findUnique({
      where: { id: discountId }
    })

    if (!discount) {
      return { success: false, error: 'Discount not found' }
    }

    // Get the fees to revert
    const feesToRevert = await prisma.fee.findMany({
      where: { discountId: discountId }
    })

    // Revert each fee individually
    for (const fee of feesToRevert) {
      await prisma.fee.update({
        where: { id: fee.id },
        data: {
          discountId: null,
          discountAmount: 0,
          finalAmount: fee.amount // Reset to original amount
        }
      })
    }

    // Delete the discount
    await prisma.studentDiscount.delete({
      where: { id: discountId }
    })

    revalidatePath('/admin/fees')
    revalidatePath('/admin/fees/by-course')
    return { success: true }
  } catch (error: any) {
    console.error('Remove discount error:', error)
    return { success: false, error: 'Failed to remove discount' }
  }
}
