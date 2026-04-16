// app/api/admin/search-courses/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
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
