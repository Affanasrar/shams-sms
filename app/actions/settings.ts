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
    revalidatePath('/admin/schedule')
    return { success: true, message: "✅ Room Created" }
  } catch (e) {
    return { success: false, error: "Failed to create room" }
  }
}

// Edit Room
export async function editRoom(prevState: any, formData: FormData) {
  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const capacity = parseInt(formData.get('capacity') as string)

  try {
    await prisma.room.update({
      where: { id },
      data: { name, capacity }
    })
    revalidatePath('/admin/settings')
    revalidatePath('/admin/schedule')
    return { success: true, message: "✅ Room Updated" }
  } catch (e) {
    return { success: false, error: "Failed to update room" }
  }
}

// Delete Room
export async function deleteRoom(prevState: any, formData: FormData) {
  const id = formData.get('id') as string

  try {
    // Check if room is used in any slots
    const slotsCount = await prisma.slot.count({ where: { roomId: id } })
    if (slotsCount > 0) {
      return { success: false, error: "Cannot delete room that has slots assigned" }
    }

    await prisma.room.delete({ where: { id } })
    revalidatePath('/admin/settings')
    revalidatePath('/admin/schedule')
    return { success: true, message: "✅ Room Deleted" }
  } catch (e) {
    return { success: false, error: "Failed to delete room" }
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
    revalidatePath('/admin/schedule')
    return { success: true, message: "✅ Course Created" }
  } catch (e) {
    return { success: false, error: "Failed to create course" }
  }
}

// Edit Course
export async function editCourse(prevState: any, formData: FormData) {
  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const fee = parseFloat(formData.get('fee') as string)
  const duration = parseInt(formData.get('duration') as string)

  try {
    await prisma.course.update({
      where: { id },
      data: {
        name,
        baseFee: fee,
        durationMonths: duration
      }
    })
    revalidatePath('/admin/settings')
    revalidatePath('/admin/schedule')
    return { success: true, message: "✅ Course Updated" }
  } catch (e) {
    return { success: false, error: "Failed to update course" }
  }
}

// Delete Course
export async function deleteCourse(prevState: any, formData: FormData) {
  const id = formData.get('id') as string

  try {
    // Check if course is used in any assignments
    const assignmentsCount = await prisma.courseOnSlot.count({ where: { courseId: id } })
    if (assignmentsCount > 0) {
      return { success: false, error: "Cannot delete course that has slots assigned" }
    }

    await prisma.course.delete({ where: { id } })
    revalidatePath('/admin/settings')
    revalidatePath('/admin/schedule')
    return { success: true, message: "✅ Course Deleted" }
  } catch (e) {
    return { success: false, error: "Failed to delete course" }
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
    revalidatePath('/admin/schedule')
    return { success: true, message: "✅ Slot Created" }
  } catch (e) {
    return { success: false, error: "Failed to create slot" }
  }
}

// Edit Slot
export async function editSlot(prevState: any, formData: FormData) {
  const id = formData.get('id') as string
  const roomId = formData.get('roomId') as string
  const days = formData.get('days') as string
  const startStr = formData.get('startTime') as string
  const endStr = formData.get('endTime') as string

  const baseDate = "1970-01-01T"
  const startTime = new Date(`${baseDate}${startStr}:00Z`)
  const endTime = new Date(`${baseDate}${endStr}:00Z`)

  try {
    await prisma.slot.update({
      where: { id },
      data: {
        roomId,
        days,
        startTime,
        endTime
      }
    })
    revalidatePath('/admin/settings')
    revalidatePath('/admin/schedule')
    return { success: true, message: "✅ Slot Updated" }
  } catch (e) {
    return { success: false, error: "Failed to update slot" }
  }
}

// Delete Slot
export async function deleteSlot(prevState: any, formData: FormData) {
  const id = formData.get('id') as string

  try {
    // Check if slot is used in any assignments
    const assignmentsCount = await prisma.courseOnSlot.count({ where: { slotId: id } })
    if (assignmentsCount > 0) {
      return { success: false, error: "Cannot delete slot that has courses assigned" }
    }

    await prisma.slot.delete({ where: { id } })
    revalidatePath('/admin/settings')
    revalidatePath('/admin/schedule')
    return { success: true, message: "✅ Slot Deleted" }
  } catch (e) {
    return { success: false, error: "Failed to delete slot" }
  }
}

// Assign Course to Slot
export async function assignCourseToSlot(prevState: any, formData: FormData) {
  const slotId = formData.get('slotId') as string
  const courseId = formData.get('courseId') as string
  const teacherId = formData.get('teacherId') as string

  if (!slotId || !courseId || !teacherId) {
    return { success: false, error: "Please select Course, Slot, and Teacher." }
  }

  try {
    const existing = await prisma.courseOnSlot.findFirst({
      where: { slotId, courseId }
    })

    if (existing) return { success: false, error: "This course is already assigned to this slot." }

    await prisma.courseOnSlot.create({
      data: {
        slotId,
        courseId,
        teacherId
      }
    })
    
    revalidatePath('/admin/settings')
    revalidatePath('/admin/schedule')
    return { success: true, message: "✅ Class Scheduled & Teacher Assigned" }
  } catch (e) {
    console.error(e)
    return { success: false, error: "Database Error" }
  }
}

// Change Teacher (for forms)
export async function changeTeacherForm(formData: FormData) {
  const assignmentId = formData.get('assignmentId') as string
  const teacherId = formData.get('teacherId') as string

  if (!assignmentId || !teacherId) {
    throw new Error("Please select assignment and teacher.")
  }

  try {
    await prisma.courseOnSlot.update({
      where: { id: assignmentId },
      data: { teacherId }
    })
    
    revalidatePath('/admin/settings')
    revalidatePath('/admin/schedule')
  } catch (e) {
    console.error(e)
    throw new Error("Failed to change teacher")
  }
}

// Delete Assignment (for forms)
export async function deleteAssignmentForm(formData: FormData) {
  const id = formData.get('id') as string

  try {
    // Check if assignment has enrollments
    const enrollmentsCount = await prisma.enrollment.count({ where: { courseOnSlotId: id } })
    if (enrollmentsCount > 0) {
      // For forms, we can't return error objects, so we'll throw
      throw new Error("Cannot delete assignment that has students enrolled")
    }

    await prisma.courseOnSlot.delete({ where: { id } })
    revalidatePath('/admin/settings')
    revalidatePath('/admin/schedule')
  } catch (e) {
    // For forms, we need to handle errors differently
    console.error('Delete assignment error:', e)
    throw e
  }
}