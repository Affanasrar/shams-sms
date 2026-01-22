// app/actions/settings.ts
'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { FeeType } from '@prisma/client'

// 1. Create Room
export async function createRoom(prevState: any, formData: FormData) {
  const name = formData.get('name') as string
  const capacity = parseInt(formData.get('capacity') as string)

  try {
    await prisma.room.create({ data: { name, capacity } })
    revalidatePath('/admin/settings')
    return { success: true, message: "✅ Room Created" }
  } catch (e) {
    return { success: false, error: "Failed to create room" }
  }
}

// 2. Create Course
export async function createCourse(prevState: any, formData: FormData) {
  const name = formData.get('name') as string
  const fee = parseFloat(formData.get('fee') as string)
  const duration = parseInt(formData.get('duration') as string)
  
  try {
    await prisma.course.create({
      data: {
        name,
        baseFee: fee,
        durationMonths: duration,
        feeType: FeeType.MONTHLY // Defaulting to Monthly for now
      }
    })
    revalidatePath('/admin/settings')
    return { success: true, message: "✅ Course Created" }
  } catch (e) {
    return { success: false, error: "Failed to create course" }
  }
}

// 3. Create Slot (Time Block)
export async function createSlot(prevState: any, formData: FormData) {
  const roomId = formData.get('roomId') as string
  const days = formData.get('days') as string
  const startStr = formData.get('startTime') as string // "09:00"
  const endStr = formData.get('endTime') as string     // "10:00"

  // Convert "09:00" to a Date object (Date part doesn't matter, only Time)
  const baseDate = "1970-01-01T"
  const startTime = new Date(`${baseDate}${startStr}:00Z`)
  const endTime = new Date(`${baseDate}${endStr}:00Z`)

  try {
    await prisma.slot.create({
      data: {
        roomId,
        days,
        startTime,
        endTime
      }
    })
    revalidatePath('/admin/settings')
    return { success: true, message: "✅ Slot Created" }
  } catch (e) {
    return { success: false, error: "Failed to create slot" }
  }
}
export async function assignCourseToSlot(prevState: any, formData: FormData) {
  const slotId = formData.get('slotId') as string
  const courseId = formData.get('courseId') as string
  const teacherId = formData.get('teacherId') as string // 👈 NEW INPUT

  if (!slotId || !courseId || !teacherId) {
    return { success: false, error: "Please select Course, Slot, and Teacher." }
  }

  try {
    const existing = await prisma.courseOnSlot.findFirst({
      where: { slotId, courseId } // Check if this combo exists
    })

    if (existing) return { success: false, error: "This course is already assigned to this slot." }

    await prisma.courseOnSlot.create({
      data: {
        slotId,
        courseId,
        teacherId // 👈 SAVE THE TEACHER
      }
    })
    
    revalidatePath('/admin/settings')
    return { success: true, message: "✅ Class Scheduled & Teacher Assigned" }
  } catch (e) {
    console.error(e)
    return { success: false, error: "Database Error" }
  }
}