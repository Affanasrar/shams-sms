// app/api/admin/attendance/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const date = searchParams.get('date')

    if (!classId || !date) {
      return NextResponse.json({ error: 'Missing classId or date' }, { status: 400 })
    }

    const attendanceDate = new Date(date)

    // Fetch attendance records for the specified class and date
    const attendance = await prisma.attendance.findMany({
      where: {
        courseOnSlotId: classId,
        date: {
          gte: new Date(attendanceDate.getFullYear(), attendanceDate.getMonth(), attendanceDate.getDate()),
          lt: new Date(attendanceDate.getFullYear(), attendanceDate.getMonth(), attendanceDate.getDate() + 1)
        }
      },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            name: true,
            fatherName: true
          }
        },
        markedBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { student: { name: 'asc' } }
    })

    return NextResponse.json(attendance)
  } catch (error) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}