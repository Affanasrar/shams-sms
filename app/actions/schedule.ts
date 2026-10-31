'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

interface MoveClassScheduleParams {
  assignmentId: string
  targetRoomId: string
  targetHour: number // 0-23
  targetDays?: string
  targetDurationHours?: number
}

export async function moveClassSchedule({
  assignmentId,
  targetRoomId,
  targetHour,
  targetDays,
  targetDurationHours = 1
}: MoveClassScheduleParams) {
  if (!assignmentId || !targetRoomId || targetHour === undefined || targetHour === null) {
    return { success: false, error: 'Invalid parameters for class reschedule.' }
  }

  try {
    // 1. Fetch current assignment with slot, course, and enrollments
    const currentAssignment = await prisma.courseOnSlot.findUnique({
      where: { id: assignmentId },
      include: {
        slot: {
          include: { room: true }
        },
        course: true,
        enrollments: {
          where: { status: { in: ['ACTIVE', 'PENDING_COMPLETION'] } }
        }
      }
    })

    if (!currentAssignment) {
      return { success: false, error: 'Class assignment not found.' }
    }

    // 2. Fetch target room and check capacity
    const targetRoom = await prisma.room.findUnique({
      where: { id: targetRoomId }
    })

    if (!targetRoom) {
      return { success: false, error: 'Target room not found.' }
    }

    const enrolledCount = currentAssignment.enrollments.length
    if (targetRoom.capacity > 0 && enrolledCount > targetRoom.capacity) {
      return {
        success: false,
        error: `Cannot move: Class has ${enrolledCount} enrolled students, but ${targetRoom.name} only has capacity for ${targetRoom.capacity} seats.`
      }
    }

    // 3. Determine days and duration
    const days = (targetDays || currentAssignment.slot.days || 'ALL').trim()
    
    // Calculate current duration in hours if targetDurationHours is not provided
    let durationHours = targetDurationHours
    if (!durationHours || durationHours <= 0) {
      const curStart = new Date(currentAssignment.slot.startTime)
      const curEnd = new Date(currentAssignment.slot.endTime)
      const diffHours = Math.round((curEnd.getTime() - curStart.getTime()) / (1000 * 60 * 60))
      durationHours = diffHours > 0 ? diffHours : 1
    }

    // 4. Construct target startTime and endTime in UTC
    // In Pakistan local time (UTC+5), hour `targetHour` starts at baseDate:
    const baseDate = '1970-01-01T'
    const startH = Math.max(0, Math.min(23, targetHour))
    const endH = (startH + durationHours) % 24
    
    const startStr = `${String(startH).padStart(2, '0')}:00:00`
    const endStr = `${String(endH).padStart(2, '0')}:00:00`

    const startTimeLocal = new Date(`${baseDate}${startStr}`)
    const endTimeLocal = new Date(`${baseDate}${endStr}`)
    const pakistanOffsetMs = 5 * 60 * 60 * 1000

    const targetStartTime = new Date(startTimeLocal.getTime() - pakistanOffsetMs)
    const targetEndTime = new Date(endTimeLocal.getTime() - pakistanOffsetMs)

    // 5. Check if target slot already exists
    const targetSlot = await prisma.slot.findFirst({
      where: {
        roomId: targetRoomId,
        days: days,
        startTime: targetStartTime,
        endTime: targetEndTime
      }
    })

    // Check if the current slot is shared with other courses
    const otherCoursesInCurrentSlot = await prisma.courseOnSlot.count({
      where: {
        slotId: currentAssignment.slotId,
        id: { not: assignmentId }
      }
    })

    if (targetSlot) {
      // Check if target slot already has this same course
      const courseAlreadyInTarget = await prisma.courseOnSlot.findFirst({
        where: {
          slotId: targetSlot.id,
          courseId: currentAssignment.courseId,
          id: { not: assignmentId }
        }
      })

      if (courseAlreadyInTarget) {
        return {
          success: false,
          error: `${currentAssignment.course.name} is already assigned to this slot in ${targetRoom.name}.`
        }
      }

      // Check capacity in target slot (including other courses sharing that target slot)
      const targetSlotCurrentOccupancy = await prisma.enrollment.count({
        where: {
          courseOnSlot: { slotId: targetSlot.id },
          status: { in: ['ACTIVE', 'PENDING_COMPLETION'] }
        }
      })

      if (targetSlotCurrentOccupancy + enrolledCount > targetRoom.capacity) {
        return {
          success: false,
          error: `Target slot in ${targetRoom.name} would exceed capacity (${targetSlotCurrentOccupancy + enrolledCount}/${targetRoom.capacity} seats).`
        }
      }

      // Re-assign to existing target slot
      await prisma.courseOnSlot.update({
        where: { id: assignmentId },
        data: { slotId: targetSlot.id }
      })

      // If the old slot had no other courses, clean it up
      if (otherCoursesInCurrentSlot === 0 && currentAssignment.slotId !== targetSlot.id) {
        try {
          await prisma.slot.delete({ where: { id: currentAssignment.slotId } })
        } catch (cleanupErr) {
          // Non-critical if slot delete fails
          console.warn('Old slot cleanup skipped:', cleanupErr)
        }
      }
    } else {
      // Target slot doesn't exist yet
      if (otherCoursesInCurrentSlot === 0) {
        // Current slot is solely used by this class, we can update the slot directly!
        await prisma.slot.update({
          where: { id: currentAssignment.slotId },
          data: {
            roomId: targetRoomId,
            days: days,
            startTime: targetStartTime,
            endTime: targetEndTime
          }
        })
      } else {
        // Other courses share current slot; create a new target slot and move this class
        const newSlot = await prisma.slot.create({
          data: {
            roomId: targetRoomId,
            days: days,
            startTime: targetStartTime,
            endTime: targetEndTime
          }
        })

        await prisma.courseOnSlot.update({
          where: { id: assignmentId },
          data: { slotId: newSlot.id }
        })
      }
    }

    revalidatePath('/admin/schedule')
    revalidatePath('/receptionist/schedule')
    revalidatePath('/admin/settings')

    return {
      success: true,
      message: `Successfully moved ${currentAssignment.course.name} to ${targetRoom.name}!`
    }
  } catch (error) {
    console.error('Error in moveClassSchedule:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to move class schedule.'
    }
  }
}
