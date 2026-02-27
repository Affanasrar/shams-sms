// app/api/admin/search-fees/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
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

    return NextResponse.json(fees)
  } catch (error) {
    console.error('Search fees error:', error)
    return NextResponse.json([])
  }
}
