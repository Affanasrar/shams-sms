// app/actions/finance.ts
'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { sendSmartMessage } from '@/lib/messaging'
import { logAudit } from '@/lib/audit'

export async function collectFee(feeId: string, adminId: string, paymentAmount?: number) {
  // All fee validation and updates happen inside a single transaction
  // to prevent race conditions (e.g., two admins clicking "Collect" simultaneously)
  const updatedFee = await prisma.$transaction(async (tx) => {
    // 1. Fetch the Fee atomically within the transaction
    const fee = await tx.fee.findUnique({ where: { id: feeId } })
    if (!fee) throw new Error("Fee not found")
    if (fee.status === 'PAID') throw new Error("Already Paid")

    // If no payment amount provided, use the full remaining balance.
    // NOTE: Use explicit null/undefined check — do NOT use `||` since paymentAmount=0 is falsy
    const remainingBalance = Number(fee.finalAmount) - Number(fee.paidAmount)
    const amountToPay = (paymentAmount != null && paymentAmount > 0) ? paymentAmount : remainingBalance

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

    return { fee: result, amountPaid: amountToPay, newRemainingAmount }
  }).catch((error: Error) => {
    return { error: error.message }
  })

  // Handle transaction errors
  if ('error' in updatedFee) {
    return { success: false, error: updatedFee.error }
  }

  // Send Instant WhatsApp Payment Receipt
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
      const receiptMessage = `🧾 *PAYMENT RECEIPT — SHAMS COMMERCIAL INSTITUTE*\n\nDear *${student.name}* (${student.studentId}),\nWe have successfully received your fee payment. Thank you!\n\n▪ *Amount Paid:* PKR ${updatedFee.amountPaid.toLocaleString()}\n▪ *Course:* ${course.name}\n▪ *Remaining Balance:* PKR ${updatedFee.newRemainingAmount.toLocaleString()}\n▪ *Payment Date:* ${paymentDate}\n\nThank you for choosing Shams Commercial Institute!`

      const msgResponse = await sendSmartMessage(student.phone, receiptMessage, 'SMART')

      await prisma.smsMessage.create({
        data: {
          studentId: student.id,
          phoneNumber: student.phone,
          message: receiptMessage,
          direction: 'OUTBOUND',
          status: msgResponse.success ? 'SENT' : 'FAILED',
          textbeeId: msgResponse.id || null,
          errorMsg: msgResponse.error || null,
          sentAt: msgResponse.success ? new Date() : null
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