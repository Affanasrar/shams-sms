// app/actions/get-student-profile.ts
'use server'

import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'

export async function getStudentProfile(studentId: string) {
  // Prevent caching of database queries
  noStore()
  const student = await prisma.student.findUnique({
    where: { studentId: studentId },
    include: {
      // 1. Get Enrollments (Active & Past)
      enrollments: {
        include: {
          courseOnSlot: {
            include: {
              course: true,
              slot: { include: { room: true } }
            }
          }
        },
        orderBy: { joiningDate: 'desc' }
      },
      // 2. Get Financial Ledger (Fees + Linked Payments)
      fees: {
        include: {
          transactions: { include: { collectedBy: true } }, // Who took the money?
          enrollment: {
            include: { courseOnSlot: { include: { course: true } } }
          }
        },
        orderBy: { dueDate: 'desc' }
      },
      // 3. Get Academic Results
      results: {
        include: { course: true },
        orderBy: { date: 'desc' }
      }
    }
  })

  if (!student) notFound()
  return student
}