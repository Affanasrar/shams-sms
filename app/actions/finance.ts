// app/actions/finance.ts
'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { sendTextbeeSms } from '@/lib/textbee'

export async function collectFee(feeId: string, adminId: string, paymentAmount?: number) {
  // 1. Fetch the Fee to check amount
  const fee = await prisma.fee.findUnique({ where: { id: feeId } })
  if (!fee) return { success: false, error: "Fee not found" }
  if (fee.status === 'PAID') return { success: false, error: "Already Paid" }

  // If no payment amount provided, use the full final amount (backward compatibility)
  const amountToPay = paymentAmount || Number(fee.finalAmount)

  // Validate payment amount
  if (amountToPay <= 0) return { success: false, error: "Invalid payment amount" }
  if (amountToPay > Number(fee.finalAmount) - Number(fee.paidAmount)) {
    return { success: false, error: "Payment amount exceeds remaining balance" }
  }

  // Calculate new paid amount and determine status
  const newPaidAmount = Number(fee.paidAmount) + amountToPay
  const remainingAmount = Number(fee.finalAmount) - newPaidAmount

  let newStatus: 'UNPAID' | 'PARTIAL' | 'PAID'
  if (remainingAmount <= 0) {
    newStatus = 'PAID'
  } else if (newPaidAmount > 0) {
    newStatus = 'PARTIAL'
  } else {
    newStatus = 'UNPAID'
  }

  // 2. Transaction: Update Fee + Record Transaction
  const updatedFee = await prisma.$transaction(async (tx) => {
    await tx.fee.update({
      where: { id: feeId },
      data: { 
        paidAmount: newPaidAmount,
        status: newStatus
      }
    })

    const result = await tx.fee.findUnique({
      where: { id: feeId },
      include: {
        student: true,
        enrollment: {
          include: {
            courseOnSlot: {
              include: {
                course: true
              }
            }
          }
        }
      }
    })

    await tx.transaction.create({
      data: {
        feeId: feeId,
        amount: amountToPay,
        collectedById: adminId // Who took the cash?
      }
    })

    return result
  })

  // Send SMS for any payment event
  if (updatedFee && updatedFee.student?.phone) {
    const student = updatedFee.student
    const course = updatedFee.enrollment?.courseOnSlot?.course
    const paymentDate = new Date().toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    if (course) {
      const message = `Dear ${student.name}, we have received your payment of PKR ${amountToPay} for ${course.name} on ${paymentDate}. Thank you for choosing Shams Commercial Institute.`
      const smsResponse = await sendTextbeeSms(student.phone, message)

      const validStatuses = ['PENDING', 'SENT', 'DELIVERED', 'FAILED'] as const
      const finalStatus = smsResponse.success
        ? (smsResponse.status && validStatuses.includes(smsResponse.status) ? smsResponse.status : 'SENT')
        : 'FAILED'

      await prisma.smsMessage.create({
        data: {
          studentId: student.id,
          phoneNumber: student.phone,
          message,
          direction: 'OUTBOUND',
          status: finalStatus,
          textbeeId: smsResponse.textbeeId || null,
          errorMsg: smsResponse.error || null,
          sentAt: smsResponse.success ? new Date() : null
        }
      })
    }
  }

  revalidatePath('/admin/fees')
  revalidatePath('/admin/activities')
  return { success: true }
}