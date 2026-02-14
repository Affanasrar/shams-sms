// app/actions/attendance.ts
'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// 👇 FIX: Added 'prevState: any' as the first argument
export async function submitAttendance(prevState: any, formData: FormData) {
  const classId = formData.get('classId') as string
  const dateStr = formData.get('date') as string
  const teacherId = formData.get('teacherId') as string

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
    const date = new Date(dateStr)

    // Use upsert logic: update if exists, create if doesn't
    await prisma.$transaction(
      attendanceData.map((entry) => 
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