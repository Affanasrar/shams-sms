// app/admin/fees/by-course/page.tsx
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CourseFeeCard } from './course-fees-card'

export const dynamic = 'force-dynamic'

export default async function FeesByCourse() {
  // Helper function to convert Decimals to plain JSON objects
  const toJSON = (data: any) => JSON.parse(JSON.stringify(data, (_, value) => {
    if (value && typeof value === 'object' && typeof value.toFixed === 'function') {
      return Number(value)
    }
    return value
  }))

  // Fetch all courses with their enrolled students and fees
  const courses = await prisma.course.findMany({
    include: {
      slotAssignments: {
        include: {
          enrollments: {
            where: { status: 'ACTIVE' },
            include: {
              student: true,
              fees: {
                orderBy: { dueDate: 'asc' }
              }
            }
          }
        }
      }
    },
    orderBy: { name: 'asc' }
  })

  // Calculate total fees for each course
  const coursesWithFees = courses.map(course => {
    const allEnrollments = course.slotAssignments.flatMap(slot => slot.enrollments)
    const uniqueStudents = Array.from(new Map(
      allEnrollments.map(enrollment => [enrollment.studentId, enrollment])
    ).values())
    
    const totalUnpaid = uniqueStudents.reduce((sum, enrollment) => {
      const unpaid = enrollment.fees
        .filter(fee => fee.status === 'UNPAID' || fee.status === 'PARTIAL')
        .reduce((feeSum, fee) => feeSum + (Number(fee.finalAmount) - Number(fee.paidAmount)), 0)
      return sum + unpaid
    }, 0)

    return {
      ...course,
      baseFee: typeof course.baseFee === 'object' ? Number(course.baseFee) : course.baseFee,
      enrollmentCount: uniqueStudents.length,
      totalUnpaid,
      enrollments: uniqueStudents
    }
  })

  const serializedCourses = toJSON(coursesWithFees)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link 
          href="/admin/fees"
          className="text-gray-600 hover:text-gray-900 transition"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Course Fee Collection</h1>
          <p className="text-gray-500 text-sm">View all enrolled students and their fees by course</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {serializedCourses.map((course: any) => (
          <CourseFeeCard key={course.id} course={course} />
        ))}
      </div>

      {serializedCourses.length === 0 && (
        <div className="text-center py-12 bg-white border rounded-lg">
          <p className="text-gray-500 text-lg">No courses found.</p>
        </div>
      )}
    </div>
  )
}
