// app/actions/enrollment.ts
'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Note: This function is likely called by your Server Action wrapper, or needs to be adapted to receive (prevState, formData) if used directly in useActionState.
// Assuming this is the helper function called by the server action:

export async function enrollStudent(studentId: string, courseOnSlotId: string) {
  console.log(`⚡ Attempting to enroll Student ${studentId} into Slot Assignment ${courseOnSlotId}`)

  // Start a transaction to ensure data integrity
  return await prisma.$transaction(async (tx) => {
    
    // 1. Get the Target Slot and its Room Capacity
    const targetAssignment = await tx.courseOnSlot.findUnique({
      where: { id: courseOnSlotId },
      include: { 
        slot: {
          include: { room: true }
        },
        course: true
      }
    })

    if (!targetAssignment) {
      throw new Error("Invalid Course/Slot selection")
    }

    const slotId = targetAssignment.slotId
    const roomName = targetAssignment.slot.room.name
    const roomCapacity = targetAssignment.slot.room.capacity
    const courseDuration = targetAssignment.course.durationMonths
    const courseFee = targetAssignment.course.baseFee // Get the fee amount

    // 2. Count Total Occupancy in this Slot
    const currentOccupancy = await tx.enrollment.count({
      where: {
        courseOnSlot: {
          slotId: slotId 
        },
        status: 'ACTIVE' 
      }
    })

    console.log(`🧐 Capacity Check for ${roomName}: ${currentOccupancy}/${roomCapacity} occupied.`)

    // 3. The Guard Clause
    if (currentOccupancy >= roomCapacity) {
      throw new Error(`Room Capacity Exceeded! (${currentOccupancy}/${roomCapacity} seats taken in ${roomName})`)
    }

    // 4. Calculate End Date
    const today = new Date()
    const endDate = new Date(today)
    endDate.setMonth(endDate.getMonth() + courseDuration)

    // 5. Create the Enrollment
    const newEnrollment = await tx.enrollment.create({
      data: {
        studentId: studentId,
        courseOnSlotId: courseOnSlotId,
        joiningDate: today,
        endDate: endDate,
        status: 'ACTIVE'
      }
    })

    // ---------------------------------------------------------
    // 6. 👇 NEW: GENERATE THE FIRST INVOICE IMMEDIATELY
    // ---------------------------------------------------------
    await tx.fee.create({
      data: {
        studentId: studentId,
        enrollmentId: newEnrollment.id,
        amount: courseFee,       // Charge the Course Fee
        dueDate: today,          // Due Today
        cycleDate: today,        // Billing cycle starts today
        status: 'UNPAID'
      }
    })

    console.log(`✅ Success! Enrolled & Billed.`)
    return newEnrollment
  })
}

// ------------------------------------------------------------------
// 👇 ADD THIS WRAPPER if you are using 'useActionState' in the Form
// ------------------------------------------------------------------
export async function createEnrollment(prevState: any, formData: FormData) {
  const studentId = formData.get('studentId') as string
  const courseOnSlotId = formData.get('courseOnSlotId') as string

  if (!studentId || !courseOnSlotId) {
    return { success: false, error: "Missing fields" }
  }

  try {
    await enrollStudent(studentId, courseOnSlotId)
    // Redirect happens here to refresh page
    revalidatePath(`/admin/students/${studentId}`)
    return { success: true, message: "Enrolled successfully!" }
  } catch (e: any) {
    return { success: false, error: e.message || "Enrollment failed" }
  }
}

// Helper to fetch data (Keep this if you use it in page.tsx)
export async function getEnrollmentData() {
  const students = await prisma.student.findMany({ 
    orderBy: { name: 'asc' },
    select: { id: true, name: true, fatherName: true }
  })
  
  const assignments = await prisma.courseOnSlot.findMany({
    include: {
      course: true,
      slot: { include: { room: true } }
    }
  })

  return { students, assignments }
}