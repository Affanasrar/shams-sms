// app/api/teacher/class-students/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')

    if (!classId) {
      return NextResponse.json({ error: 'Missing classId' }, { status: 400 })
    }

    // Optional: enforce teacher ownership via Clerk auth
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Find the teacher in DB
    const teacher = await prisma.user.findFirst({ where: { clerkId: userId } })
    if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })

    // Ensure the class belongs to this teacher
    const classData = await prisma.courseOnSlot.findUnique({
      where: { id: classId },
      include: {
        course: true,
        slot: { include: { room: true } },
        enrollments: {
          where: { status: 'ACTIVE' },
          include: { student: true },
          orderBy: { student: { name: 'asc' } }
        },
        teacher: true
      }
    })

    if (!classData) return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    if (classData.teacherId && classData.teacherId !== teacher.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const students = classData.enrollments.map(e => ({
      id: e.student.id,
      studentId: e.student.studentId,
      name: e.student.name,
      fatherName: e.student.fatherName
    }))

    return NextResponse.json({
      course: { id: classData.course.id, name: classData.course.name },
      slot: classData.slot,
      students,
      totalStudents: students.length
    })
  } catch (error) {
    console.error('Error fetching class students:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
