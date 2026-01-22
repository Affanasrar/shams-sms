// app/actions/debug.ts
'use server'
import prisma from '@/lib/prisma'

export async function createDummyStudent() {
  return await prisma.student.create({
    data: {
      name: `Test Student ${Math.floor(Math.random() * 1000)}`,
      fatherName: 'Debug Father',
      phone: '0300-0000000',
    }
  })
}

// NEW: Helper to backdate an enrollment
export async function backdateEnrollment(studentId: string, months: number) {
  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId: studentId, status: 'ACTIVE' }
  })

  if (!enrollment) throw new Error("Student has no active enrollment")

  const pastDate = new Date()
  pastDate.setMonth(pastDate.getMonth() - months)

  await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: { joiningDate: pastDate }
  })
  
  return `Rewound time for student by ${months} months.`
}