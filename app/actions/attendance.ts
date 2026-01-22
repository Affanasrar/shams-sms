// app/actions/attendance.ts
'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// 👇 FIX: Added 'prevState: any' as the first argument
export async function submitAttendance(prevState: any, formData: FormData) {
  const classId = formData.get('classId') as string
  const dateStr = formData.get('date') as string
  const teacherId = formData.get('teacherId') as string

  // Convert raw form data into a list of student IDs who were PRESENT
  const entries = Array.from(formData.entries())
  const attendanceData = entries
    .filter(([key]) => key.startsWith('status_'))
    .map(([key, value]) => ({
      studentId: key.replace('status_', ''),
      status: value as 'PRESENT' | 'ABSENT' | 'LATE'
    }))

  if (attendanceData.length === 0) {
    return { success: false, error: "No students found." }
  }

  try {
    // We use a Transaction to save everyone at once
    await prisma.$transaction(
      attendanceData.map((entry) => 
        prisma.attendance.create({
          data: {
            date: new Date(dateStr),
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