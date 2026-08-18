// app/actions/fetch-options.ts
'use server'
import prisma from '@/lib/prisma'

export async function getEnrollmentOptions() {
  // 1. Get all students
  const students = await prisma.student.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, studentId: true, name: true, fatherName: true }
  })

  // 2. Get all Course Assignments with slot and room details, including shared slot enrollments
  const assignments = await prisma.courseOnSlot.findMany({
    include: {
      course: true,
      teacher: {
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      },
      slot: {
        include: {
          room: true,
          courses: {
            include: {
              enrollments: {
                where: {
                  status: { in: ['ACTIVE', 'PENDING_COMPLETION'] }
                },
                select: {
                  id: true,
                  status: true,
                  joiningDate: true,
                  endDate: true
                }
              }
            }
          }
        }
      },
      enrollments: {
        where: {
          status: { in: ['ACTIVE', 'PENDING_COMPLETION'] }
        },
        select: {
          id: true,
          status: true,
          joiningDate: true,
          endDate: true
        }
      }
    }
  })

  return { students, assignments }
}