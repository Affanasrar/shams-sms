// app/actions/finance.ts
'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { sendTextbeeSms } from '@/lib/textbee'
import { logAudit } from '@/lib/audit'

export async function collectFee(feeId: string, adminId: string, paymentAmount?: number) {
  // All fee validation and updates happen inside a single transaction
  // to prevent race conditions (e.g., two admins clicking "Collect" simultaneously)
  const updatedFee = await prisma.$transaction(async (tx) => {
    // 1. Fetch the Fee atomically within the transaction
    const fee = await tx.fee.findUnique({ where: { id: feeId } })
    if (!fee) throw new Error("Fee not found")
    if (fee.status === 'PAID') throw new Error("Already Paid")

    // If no payment amount provided, use the full remaining balance
    const remainingBalance = Number(fee.finalAmount) - Number(fee.paidAmount)
    const amountToPay = paymentAmount || remainingBalance

    // Validate payment amount
    if (amountToPay <= 0) throw new Error("Invalid payment amount")
    if (amountToPay > remainingBalance) {
      throw new Error("Payment amount exceeds remaining balance")
    }

    // Calculate new paid amount and determine status
    const newPaidAmount = Number(fee.paidAmount) + amountToPay
    const newRemainingAmount = Number(fee.finalAmount) - newPaidAmount

    let newStatus: 'UNPAID' | 'PARTIAL' | 'PAID'
    if (newRemainingAmount <= 0) {
      newStatus = 'PAID'
    } else if (newPaidAmount > 0) {
      newStatus = 'PARTIAL'
    } else {
      newStatus = 'UNPAID'
    }

    // 2. Update fee status
    await tx.fee.update({
      where: { id: feeId },
      data: { 
        paidAmount: newPaidAmount,
        status: newStatus
      }
    })

    // 3. Fetch updated fee with relations for SMS
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

    // 4. Record the transaction
    await tx.transaction.create({
      data: {
        feeId: feeId,
        amount: amountToPay,
        collectedById: adminId
      }
    })

    return { fee: result, amountPaid: amountToPay }
  }).catch((error: Error) => {
    return { error: error.message }
  })

  // Handle transaction errors
  if ('error' in updatedFee) {
    return { success: false, error: updatedFee.error }
  }

  // Send SMS for any payment event
  const feeData = updatedFee.fee
  if (feeData && feeData.student?.phone) {
    const student = feeData.student
    const course = feeData.enrollment?.courseOnSlot?.course
    const paymentDate = new Date().toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    if (course) {
      const message = `Dear ${student.name}, we have received your payment of PKR ${updatedFee.amountPaid} for ${course.name} on ${paymentDate}. Thank you for choosing Shams Commercial Institute.`
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

  // Audit log
  const feeResult = updatedFee.fee
  if (feeResult) {
    await logAudit({
      action: 'FEE_COLLECTED',
      entity: 'Fee',
      entityId: feeId,
      userId: adminId,
      details: {
        studentName: feeResult.student?.name,
        amountPaid: updatedFee.amountPaid,
        newStatus: feeResult.status,
        totalPaid: Number(feeResult.paidAmount),
        totalDue: Number(feeResult.finalAmount),
      },
    })
  }

  revalidatePath('/admin/fees')
  revalidatePath('/admin/activities')
  return { success: true }
}