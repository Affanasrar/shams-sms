// app/api/admin/search-students/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
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
      include: {
        enrollments: {
          where: { status: 'ACTIVE' },
          include: {
            courseOnSlot: {
              include: {
                course: true
              }
            },
            fees: {
              orderBy: { dueDate: 'asc' }
            }
          }
        }
      },
      take: 10 // Limit results
    })

    return NextResponse.json(students)
  } catch (error) {
    console.error('Search students error:', error)
    return NextResponse.json({ error: 'Failed to search students' }, { status: 500 })
  }
}