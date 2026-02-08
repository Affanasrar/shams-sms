// app/api/admin/search-courses/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
    }

    // Search courses by name
    const courses = await prisma.course.findMany({
      where: {
        name: { contains: query, mode: 'insensitive' }
      },
      include: {
        slotAssignments: {
          include: {
            teacher: true,
            slot: { include: { room: true } },
            enrollments: true
          }
        }
      },
      take: 10 // Limit results
    })

    return NextResponse.json(courses)
  } catch (error) {
    console.error('Search courses error:', error)
    return NextResponse.json({ error: 'Failed to search courses' }, { status: 500 })
  }
}
