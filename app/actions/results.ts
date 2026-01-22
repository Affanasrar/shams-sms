// app/actions/results.ts
'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// 1. Helper: Find what courses a student has taken
export async function getStudentCourses(studentId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: studentId },
    include: {
      courseOnSlot: {
        include: { course: true }
      }
    }
  })

  // Simplify the data for the frontend
  return enrollments.map(e => ({
    courseId: e.courseOnSlot.courseId,
    courseName: e.courseOnSlot.course.name,
    status: e.status
  }))
}

// 2. Action: Save the Result
export async function saveResult(prevState: any, formData: FormData) {
  const studentId = formData.get('studentId') as string
  const courseId = formData.get('courseId') as string
  const marks = parseFloat(formData.get('marks') as string)
  const total = parseFloat(formData.get('total') as string)
  const grade = formData.get('grade') as string
  const attempt = parseInt(formData.get('attempt') as string) || 1

  if (!studentId || !courseId) return { success: false, error: "Invalid Selection" }

  try {
    await prisma.result.create({
      data: {
        studentId,
        courseId,
        marks,
        total,
        grade,
        attempt
      }
    })
  } catch (error) {
    return { success: false, error: "Database Error" }
  }

  revalidatePath(`/admin/students/${studentId}`)
  redirect(`/admin/students/${studentId}`)
}