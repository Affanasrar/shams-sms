// app/api/admin/search-fees/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
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
      include: {
        student: true,
        enrollment: {
          include: {
            courseOnSlot: { include: { course: true } }
          }
        },
        transactions: true
      },
      orderBy: { dueDate: 'desc' },
      take: 10 // Limit results
    })

    return NextResponse.json(fees)
  } catch (error) {
    console.error('Search fees error:', error)
    return NextResponse.json({ error: 'Failed to search fees' }, { status: 500 })
  }
}
