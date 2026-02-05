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

    // Calculate the actual cycle dates that match the cron job logic
    // The cron job creates fees with cycleDate = new Date(year, month, 1) where month is based on joining date + monthsDiff
    const joiningDate = enrollment.joiningDate
    const joiningYear = joiningDate.getFullYear()
    const joiningMonth = joiningDate.getMonth() // 0-based
    
    // Calculate which month number this enrollment is currently in
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth()
    
    // For each applicable month, calculate the corresponding cycle date
    const affectedCycleDates: Date[] = []
    
    for (let monthNum = validated.data.applicableFromMonth; monthNum <= applicableToMonth; monthNum++) {
      // Calculate the target month: joining month + (monthNum - 1)
      const targetMonth = joiningMonth + (monthNum - 1)
      const targetYear = joiningYear + Math.floor(targetMonth / 12)
      const targetMonthNormalized = targetMonth % 12
      
      // Create cycle date (1st of the target month)
      const cycleDate = new Date(targetYear, targetMonthNormalized, 1)
      affectedCycleDates.push(cycleDate)
    }
    
    // Find fees with these cycle dates (only unpaid or partially paid fees)
    const affectedFees = await prisma.fee.findMany({
      where: {
        enrollmentId: validated.data.enrollmentId,
        cycleDate: {
          in: affectedCycleDates
        },
        status: {
          in: ['UNPAID', 'PARTIAL'] // Only apply discounts to fees that haven't been fully paid
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

      const finalAmount = (Number(fee.amount) - discountAmount) + Number(fee.rolloverAmount)

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

    // Get the fees to revert (only unpaid or partially paid fees)
    const feesToRevert = await prisma.fee.findMany({
      where: {
        discountId: discountId,
        status: {
          in: ['UNPAID', 'PARTIAL'] // Only revert discounts on unpaid fees
        }
      }
    })

    // Revert each fee individually
    for (const fee of feesToRevert) {
      await prisma.fee.update({
        where: { id: fee.id },
        data: {
          discountId: null,
          discountAmount: 0,
          finalAmount: Number(fee.amount) + Number(fee.rolloverAmount) // Reset to original amount + rollover
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
