// app/api/admin/collect-fee/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { collectFee } from '@/app/actions/finance'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Verify user is admin
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user || user.role !== 'ADMIN') {
      // Log unauthorized attempt
      console.warn(`Unauthorized collect-fee attempt by ${userId}`)
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    // 3. Parse and validate request
    const { feeId, amount } = await request.json()

    if (!feeId || amount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: feeId, amount' },
        { status: 400 }
      )
    }

    // 4. Collect fee using authenticated admin ID
    const result = await collectFee(feeId, userId, amount)

    if (result.success) {
      // Log successful collection
      console.log(`Fee ${feeId} collected by admin ${userId} (amount: ${amount})`)
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
  } catch (error) {
    console.error('Collect fee error:', error)
    return NextResponse.json({ error: 'Failed to collect fee' }, { status: 500 })
  }
}