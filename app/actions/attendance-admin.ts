// app/actions/attendance-admin.ts
'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function updateAttendance(
  classId: string,
  studentId: string,
  dateStr: string,
  status: string,
  adminId: string
) {
  try {
    const date = new Date(dateStr)

    // Check if attendance record already exists
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        studentId_courseOnSlotId_date: {
          studentId,
          courseOnSlotId: classId,
          date
        }
      }
    })

    if (existingAttendance) {
      // Update existing record
      await prisma.attendance.update({
        where: { id: existingAttendance.id },
        data: {
          status: status as 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE',
          markedById: adminId // Update who marked it (admin override)
        }
      })
    } else {
      // Create new record
      await prisma.attendance.create({
        data: {
          studentId,
          courseOnSlotId: classId,
          date,
          status: status as 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE',
          markedById: adminId
        }
      })
    }

    revalidatePath(`/admin/attendance/${classId}`)
    return { success: true }
  } catch (error) {
    console.error('Error updating attendance:', error)
    return { success: false, error: 'Failed to update attendance' }
  }
}