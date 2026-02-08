import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    // Expecting { classId, teacherId, date, entries: [{ studentId, status }] }
    const { classId, teacherId, date, entries } = body
    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json({ success: false, error: 'No attendance entries provided' }, { status: 400 })
    }

    await prisma.$transaction(
      entries.map((entry: any) =>
        prisma.attendance.create({
          data: {
            date: new Date(date),
            status: entry.status,
            studentId: entry.studentId,
            courseOnSlotId: classId,
            markedById: teacherId,
          },
        }),
      ),
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API teacher attendance error', error)
    return NextResponse.json({ success: false, error: 'Failed to save attendance' }, { status: 500 })
  }
}
