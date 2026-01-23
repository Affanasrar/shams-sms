// app/api/enrollments/route.ts
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { status: 'ACTIVE' },
      include: {
        student: true,
        courseOnSlot: { include: { course: true } }
      },
      orderBy: { joiningDate: 'desc' }
    })

    return NextResponse.json(enrollments)
  } catch (error) {
    console.error('Error fetching enrollments:', error)
    return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 })
  }
}
