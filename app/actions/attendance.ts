// app/actions/attendance.ts
'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// 👇 FIX: Added 'prevState: any' as the first argument
export async function submitAttendance(prevState: any, formData: FormData) {
  const classId = formData.get('classId') as string
  const dateStr = formData.get('date') as string
  const teacherId = formData.get('teacherId') as string

  // Validation: Check required fields
  if (!classId || !dateStr || !teacherId) {
    return { success: false, error: "Missing required fields." }
  }

  // Validation: Check date format
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) {
    return { success: false, error: "Invalid date format." }
  }

  // Convert raw form data into a list of student IDs with their status
  const entries = Array.from(formData.entries())
  const attendanceData = entries
    .filter(([key]) => key.startsWith('status_'))
    .map(([key, value]) => ({
      studentId: key.replace('status_', ''),
      status: value as 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE'
    }))

  if (attendanceData.length === 0) {
    return { success: false, error: "No students found." }
  }

  try {
    // Permission Check: Verify teacher has access to this class
    const courseOnSlot = await prisma.courseOnSlot.findUnique({
      where: { id: classId },
      select: { teacherId: true }
    })

    if (!courseOnSlot || courseOnSlot.teacherId !== teacherId) {
      return { success: false, error: "Unauthorized access." }
    }

    // Enrollment Verification: Ensure students are actively enrolled
    const validStudents = await prisma.enrollment.findMany({
      where: {
        courseOnSlotId: classId,
        status: 'ACTIVE'
      },
      select: { studentId: true }
    })

    const validStudentIds = new Set(validStudents.map(e => e.studentId))
    const filteredAttendanceData = attendanceData.filter(
      entry => validStudentIds.has(entry.studentId)
    )

    if (filteredAttendanceData.length === 0) {
      return { success: false, error: "No valid enrolled students found." }
    }

    // Use upsert logic: update if exists, create if doesn't
    await prisma.$transaction(
      filteredAttendanceData.map((entry) => 
        prisma.attendance.upsert({
          where: {
            studentId_courseOnSlotId_date: {
              studentId: entry.studentId,
              courseOnSlotId: classId,
              date
            }
          },
          // Update if exists
          update: {
            status: entry.status,
            markedById: teacherId
          },
          // Create if doesn't exist
          create: {
            date,
            status: entry.status,
            studentId: entry.studentId,
            courseOnSlotId: classId,
            markedById: teacherId
          }
        })
      )
    )

    revalidatePath(`/teacher/attendance/${classId}`)
    return { success: true, message: "✅ Attendance Saved Successfully!" }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Failed to save attendance." }
  }
}