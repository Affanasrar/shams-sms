// app/api/admin/collect-fee/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { collectFee } from '@/app/actions/finance'

export async function POST(request: NextRequest) {
  try {
    const { feeId, adminId, amount } = await request.json()

    if (!feeId || !adminId || amount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: feeId, adminId, amount' },
        { status: 400 }
      )
    }

    const result = await collectFee(feeId, adminId, amount)

    if (result.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
  } catch (error) {
    console.error('Collect fee error:', error)
    return NextResponse.json({ error: 'Failed to collect fee' }, { status: 500 })
  }
}