// app/actions/student.ts
'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { generateStudentId } from '@/lib/utils'

// 1. Validation Schema
const StudentSchema = z.object({
  name: z.string().min(3, "Name is required"),
  fatherName: z.string().min(3, "Father Name is required"),
  phone: z.string().min(10, "Phone number is required"),
  address: z.string().optional(),
})

export async function createStudent(prevState: any, formData: FormData) {
  
  // 2. Extract Data
  const rawData = {
    name: formData.get('name'),
    fatherName: formData.get('fatherName'),
    phone: formData.get('phone'),
    address: formData.get('address'),
  }

  // 3. Validate
  const validated = StudentSchema.safeParse(rawData)
  
  if (!validated.success) {
    // 👈 CHANGED: Used .issues instead of .errors to fix the red squiggly
    return { success: false, error: validated.error.issues[0].message }
  }

  // 4. Save to Database
  try {
    // Generate unique student ID
    const studentId = await generateStudentId(prisma)
    
    await prisma.student.create({
      data: {
        studentId: studentId,
        name: validated.data.name as string,
        fatherName: validated.data.fatherName as string,
        phone: validated.data.phone as string,
        address: (validated.data.address as string) || '',
      }
    })
  } catch (error: any) {
    // 👈 ADDED: Log the REAL error to your terminal
    console.error("❌ CRITICAL DATABASE ERROR:", error)
    
    // Check for common errors (like Unique Constraints)
    if (error.code === 'P2002') {
      if (error.meta?.target?.includes('phone')) {
        return { success: false, error: "This phone number is already registered." }
      }
      if (error.meta?.target?.includes('studentId')) {
        return { success: false, error: "Student ID generation failed. Please try again." }
      }
    }
    
    return { success: false, error: "Database Error: See terminal for details." }
  }

  // 5. Refresh & Redirect
  revalidatePath('/admin/students')
  redirect('/admin/students')
}

const StudentUpdateSchema = StudentSchema.extend({
  id: z.string().min(1, 'Student ID is required'),
  studentId: z.string().min(1, 'Student Route ID is required'),
})

export async function updateStudent(prevState: any, formData: FormData) {
  const rawData = {
    id: formData.get('id'),
    studentId: formData.get('studentId'),
    name: formData.get('name'),
    fatherName: formData.get('fatherName'),
    phone: formData.get('phone'),
    address: formData.get('address'),
  }

  const validated = StudentUpdateSchema.safeParse(rawData)
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message }
  }

  try {
    await prisma.student.update({
      where: { id: validated.data.id },
      data: {
        name: validated.data.name,
        fatherName: validated.data.fatherName,
        phone: validated.data.phone,
        address: (validated.data.address as string) || '',
      },
    })
  } catch (error: any) {
    console.error('❌ Failed to update student profile:', error)
    return { success: false, error: 'Unable to save changes. Please try again.' }
  }

  revalidatePath('/admin/students')
  revalidatePath(`/admin/students/${validated.data.studentId}`)
  redirect(`/admin/students/${validated.data.studentId}`)
}