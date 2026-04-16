// app/api/admin/search-fees/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { serializeDecimals } from '@/lib/serialize-decimals'
import { verifyAdminApiRole } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  // ✅ ROLE VERIFICATION: Verify admin access
  const { isAdmin } = await verifyAdminApiRole()
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Forbidden: Admin access required' },
      { status: 403 }
    )
  }
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.trim().length === 0) {
      return NextResponse.json([])
    }

    // Search fees by student name or ID
    const fees = await prisma.fee.findMany({
      where: {
        student: {
          OR: [
            { studentId: { contains: query, mode: 'insensitive' } },
            { name: { contains: query, mode: 'insensitive' } }
          ]
        }
      },
      select: {
        id: true,
        studentId: true,
        amount: true,
        status: true,
        student: {
          select: {
            name: true,
            studentId: true
          }
        }
      },
      orderBy: { dueDate: 'desc' },
      take: 10
    })

    return NextResponse.json(serializeDecimals(fees))
  } catch (error) {
    console.error('Search fees error:', error)
    return NextResponse.json([])
  }
}
