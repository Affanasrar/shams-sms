// app/api/admin/attendance/reports/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    if (!classId || !month || !year) {
      return NextResponse.json({ error: 'Missing classId, month, or year' }, { status: 400 })
    }

    const monthNum = parseInt(month)
    const yearNum = parseInt(year)

    if (monthNum < 1 || monthNum > 12) {
      return NextResponse.json({ error: 'Invalid month' }, { status: 400 })
    }

    // Get class details
    const classData = await prisma.courseOnSlot.findUnique({
      where: { id: classId },
      include: {
        course: true,
        slot: { include: { room: true } },
        teacher: true,
        enrollments: {
          where: { status: 'ACTIVE' },
          include: { student: true },
          orderBy: { student: { name: 'asc' } }
        }
      }
    })

    if (!classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    // Get start and end dates for the month
    const startDate = new Date(yearNum, monthNum - 1, 1)
    const endDate = new Date(yearNum, monthNum, 1)

    // Fetch all attendance records for the month
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        courseOnSlotId: classId,
        date: {
          gte: startDate,
          lt: endDate
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
        }
      },
      orderBy: [
        { student: { name: 'asc' } },
        { date: 'asc' }
      ]
    })

    // Group attendance by student
    const studentAttendance: Record<string, any> = {}

    classData.enrollments.forEach(enrollment => {
      studentAttendance[enrollment.student.id] = {
        student: enrollment.student,
        attendance: {}
      }
    })

    // Fill in attendance data
    attendanceRecords.forEach(record => {
      const dateKey = record.date.toISOString().split('T')[0]
      studentAttendance[record.studentId].attendance[dateKey] = record.status
    })

    // Calculate summary statistics
    const students = Object.values(studentAttendance).map((data: any) => {
      const attendance = data.attendance
      const totalDays = Object.keys(attendance).length
      const presentDays = Object.values(attendance).filter((status: any) => status === 'PRESENT').length
      const absentDays = Object.values(attendance).filter((status: any) => status === 'ABSENT').length
      const lateDays = Object.values(attendance).filter((status: any) => status === 'LATE').length
      const leaveDays = Object.values(attendance).filter((status: any) => status === 'LEAVE').length

      return {
        ...data.student,
        attendance,
        summary: {
          totalDays,
          presentDays,
          absentDays,
          lateDays,
          leaveDays,
          attendancePercentage: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0
        }
      }
    })

    const reportData = {
      course: classData.course,
      slot: classData.slot,
      teacher: classData.teacher,
      month: monthNum,
      year: yearNum,
      monthName: new Date(yearNum, monthNum - 1, 1).toLocaleDateString('en-US', { month: 'long' }),
      students,
      totalStudents: students.length,
      generatedAt: new Date()
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error('Error generating attendance report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}