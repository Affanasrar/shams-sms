// app/api/admin/search-courses/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.trim().length === 0) {
      return NextResponse.json([])
    }

    // Search courses by name
    const courses = await prisma.course.findMany({
      where: {
        name: { contains: query, mode: 'insensitive' }
      },
      select: {
        id: true,
        name: true
      },
      take: 10
    })

    return NextResponse.json(courses)
  } catch (error) {
    console.error('Search courses error:', error)
    return NextResponse.json([])
  }
}
