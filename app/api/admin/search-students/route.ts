// app/api/admin/search-students/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.trim().length === 0) {
      return NextResponse.json([])
    }

    // Search students by ID or name
    const students = await prisma.student.findMany({
      where: {
        OR: [
          { studentId: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
          { fatherName: { contains: query, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        studentId: true,
        name: true
      },
      take: 10
    })

    return NextResponse.json(students)
  } catch (error) {
    console.error('Search students error:', error)
    return NextResponse.json([])
  }
}