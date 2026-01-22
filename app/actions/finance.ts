// app/actions/finance.ts
'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function collectFee(feeId: string, adminId: string) {
  // 1. Fetch the Fee to check amount
  const fee = await prisma.fee.findUnique({ where: { id: feeId } })
  if (!fee) return { success: false, error: "Fee not found" }
  if (fee.status === 'PAID') return { success: false, error: "Already Paid" }

  // 2. Transaction: Mark Fee PAID + Record Transaction
  await prisma.$transaction([
    prisma.fee.update({
      where: { id: feeId },
      data: { status: 'PAID' }
    }),
    prisma.transaction.create({
      data: {
        feeId: feeId,
        amount: fee.amount,
        collectedById: adminId // Who took the cash?
      }
    })
  ])

  revalidatePath('/admin/fees')
  return { success: true }
}