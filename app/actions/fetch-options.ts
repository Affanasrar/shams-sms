// app/actions/fetch-options.ts
'use server'
import prisma from '@/lib/prisma'

export async function getEnrollmentOptions() {
  // 1. Get all students (In production, use search instead of fetching all)
  // 👇 FIX: Filter out students with NULL names - they can't be displayed properly
  const students = await prisma.student.findMany({
    where: {
      AND: [
        { name: { not: null } },
        { fatherName: { not: null } }
      ]
    },
    orderBy: { name: 'asc' },
    select: { id: true, studentId: true, name: true, fatherName: true } // Include studentId
  })

  // 2. Get all Course Assignments
  // We group them so the frontend can filter: "If I select English, show me English Slots"
  const assignments = await prisma.courseOnSlot.findMany({
    include: {
      course: true,
      slot: { include: { room: true } }
    }
  })

  return { students, assignments }
}