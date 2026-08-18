'use server'

import prisma from '@/lib/prisma'
import { z } from 'zod'
import { generateStudentId } from '@/lib/utils'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { OnboardingSchema } from '@/app/admin/students/new/schema'

export async function onboardStudentAction(rawData: z.infer<typeof OnboardingSchema>) {
  // Validate data
  const validated = OnboardingSchema.safeParse(rawData)
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message }
  }
  
  const data = validated.data

  // Verify staff role (ADMIN or RECEPTIONIST)
  const { userId } = await auth()
  if (!userId) {
    return { success: false, error: 'Unauthorized access. Please log in.' }
  }

  const currentUser = await prisma.user.findUnique({
    where: { clerkId: userId }
  })

  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'RECEPTIONIST')) {
    return { success: false, error: 'Unauthorized. Staff or Admin privileges required.' }
  }

  try {
    const studentIdStr = await generateStudentId(prisma)
    
    // Execute a Prisma interactive transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. ALWAYS Create Student
      const student = await tx.student.create({
        data: {
          studentId: studentIdStr,
          name: data.name.trim(),
          fatherName: data.fatherName.trim(),
          phone: data.phone.trim(),
          address: data.address?.trim() || '',
        }
      })

      // 2. Conditionally Create Enrollment (if toggled on)
      if (data.isEnrolling && data.courseOnSlotId) {
        // Ensure the slot exists and has capacity
        const targetAssignment = await tx.courseOnSlot.findUnique({
          where: { id: data.courseOnSlotId },
          include: { 
            course: true,
            slot: { include: { room: true } }
          }
        })

        if (!targetAssignment) {
          throw new Error('Selected course slot not found.')
        }

        // Count Total Occupancy in this physical slot across all shared courses
        const currentOccupancy = await tx.enrollment.count({
          where: {
            courseOnSlot: { slotId: targetAssignment.slotId },
            status: { in: ['ACTIVE', 'PENDING_COMPLETION'] }
          }
        })

        if (currentOccupancy >= targetAssignment.slot.room.capacity) {
          throw new Error(
            `Selected course slot is full. ${targetAssignment.slot.room.name} has reached its capacity of ${targetAssignment.slot.room.capacity} students.`
          )
        }

        // Calculate course end date
        const today = new Date()
        const courseDuration = targetAssignment.course.durationMonths || 1
        const endDate = new Date(today)
        endDate.setMonth(endDate.getMonth() + courseDuration)

        const enrollment = await tx.enrollment.create({
          data: {
            studentId: student.id,
            courseOnSlotId: data.courseOnSlotId,
            joiningDate: today,
            endDate: endDate,
            status: 'ACTIVE',
          }
        })

        // 3. Fee Handling
        const baseFee = Number(targetAssignment.course.baseFee)
        const cycleDate = new Date(today.getFullYear(), today.getMonth(), 1)

        if (data.isPaying) {
          let finalAmount = baseFee
          let discountId: string | null = null
          let discountAmountValue = 0

          // Handle Discount
          if (data.applyDiscount && data.discountAmount && data.discountAmount > 0) {
            if (data.discountType === 'PERCENTAGE') {
              discountAmountValue = baseFee * (data.discountAmount / 100)
            } else {
              discountAmountValue = data.discountAmount
            }
            finalAmount = Math.max(0, baseFee - discountAmountValue)

            const discount = await tx.studentDiscount.create({
              data: {
                studentId: student.id,
                enrollmentId: enrollment.id,
                discountType: data.discountType || 'FIXED',
                discountAmount: data.discountAmount,
                discountDuration: data.discountDuration || 'ENTIRE_COURSE',
                applicableFromMonth: today.getMonth() + 1
              }
            })
            discountId = discount.id
          }

          const paidAmount = Math.max(0, Number(data.paymentAmount || 0))
          const feeStatus = paidAmount >= finalAmount ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'UNPAID'

          const fee = await tx.fee.create({
            data: {
              studentId: student.id,
              enrollmentId: enrollment.id,
              amount: baseFee,
              discountAmount: discountAmountValue,
              finalAmount: finalAmount,
              paidAmount: paidAmount,
              dueDate: today, 
              cycleDate: cycleDate,
              status: feeStatus,
              discountId: discountId
            }
          })

          // Create Transaction Record (if cash collected)
          if (paidAmount > 0) {
            await tx.transaction.create({
              data: {
                feeId: fee.id,
                amount: paidAmount,
                collectedById: currentUser.id
              }
            })
          }
        } else {
          // If enrolling without paying now, automatically generate UNPAID initial voucher
          await tx.fee.create({
            data: {
              studentId: student.id,
              enrollmentId: enrollment.id,
              amount: baseFee,
              discountAmount: 0,
              finalAmount: baseFee,
              paidAmount: 0,
              dueDate: today,
              cycleDate: cycleDate,
              status: 'UNPAID'
            }
          })
        }
      }

      return student
    })
    
    revalidatePath('/admin/students')
    revalidatePath('/admin/enrollment')
    revalidatePath('/admin/fees')
    revalidatePath('/admin/schedule')
    revalidatePath('/receptionist/students')
    revalidatePath('/receptionist/enrollment')
    revalidatePath('/receptionist/fees')
    revalidatePath('/receptionist/schedule')
    revalidatePath('/receptionist')
    
    return { success: true, studentId: result.studentId, studentDbId: result.id }
    
  } catch (error: any) {
    console.error('Onboarding transaction failed:', error)
    
    if (error.code === 'P2002' && error.meta?.target?.includes('phone')) {
      return { success: false, error: 'This phone number is already registered.' }
    }
    
    return { success: false, error: error.message || 'Transaction failed. No records were created.' }
  }
}
