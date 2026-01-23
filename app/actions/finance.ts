// app/actions/finance.ts
'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

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
  await prisma.$transaction([
    prisma.fee.update({
      where: { id: feeId },
      data: { 
        paidAmount: newPaidAmount,
        status: newStatus
      }
    }),
    prisma.transaction.create({
      data: {
        feeId: feeId,
        amount: amountToPay,
        collectedById: adminId // Who took the cash?
      }
    })
  ])

  revalidatePath('/admin/fees')
  return { success: true }
}