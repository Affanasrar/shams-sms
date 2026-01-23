// app/admin/fees/by-course/page.tsx
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { BookOpen, ArrowLeft } from 'lucide-react'

export default async function FeesByCourse() {
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
      enrollmentCount: uniqueStudents.length,
      totalUnpaid,
      enrollments: uniqueStudents
    }
  })

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
        {coursesWithFees.map(course => (
          <div key={course.id} className="bg-white border rounded-lg overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-600 text-white rounded-lg">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{course.name}</h2>
                    <p className="text-sm text-gray-600">
                      Duration: {course.durationMonths} months • Fee: PKR {Number(course.baseFee).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    PKR {course.totalUnpaid.toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-600">Pending</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-blue-200 flex gap-6 text-sm">
                <span className="text-gray-700"><strong>{course.enrollmentCount}</strong> Students Enrolled</span>
                <span className="text-gray-700"><strong>{course.enrollments.filter(e => e.fees.some(f => f.status === 'UNPAID' || f.status === 'PARTIAL')).length}</strong> With Pending Fees</span>
              </div>
            </div>

            {course.enrollments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 border-b text-gray-600">
                    <tr>
                      <th className="px-6 py-3">Student ID</th>
                      <th className="px-6 py-3">Student Name</th>
                      <th className="px-6 py-3">Father's Name</th>
                      <th className="px-6 py-3">Total Fees</th>
                      <th className="px-6 py-3">Paid</th>
                      <th className="px-6 py-3">Pending</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {course.enrollments.map((enrollment) => {
                      const totalFees = enrollment.fees.reduce((sum, fee) => sum + Number(fee.finalAmount), 0)
                      const paidFees = enrollment.fees.reduce((sum, fee) => sum + Number(fee.paidAmount), 0)
                      const pendingFees = enrollment.fees
                        .filter(fee => fee.status === 'UNPAID' || fee.status === 'PARTIAL')
                        .reduce((sum, fee) => sum + (Number(fee.finalAmount) - Number(fee.paidAmount)), 0)
                      
                      const status = pendingFees === 0 ? 'PAID' : (paidFees > 0 ? 'PARTIAL' : 'UNPAID')
                      const statusColor = status === 'PAID' ? 'bg-green-100 text-green-800' : 
                                         status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' : 
                                         'bg-red-100 text-red-800'

                      return (
                        <tr key={enrollment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-mono text-xs text-blue-600 font-medium">
                            {enrollment.student.studentId}
                          </td>
                          <td className="px-6 py-4 font-medium">{enrollment.student.name}</td>
                          <td className="px-6 py-4 text-gray-600">{enrollment.student.fatherName}</td>
                          <td className="px-6 py-4 font-mono">PKR {totalFees.toLocaleString()}</td>
                          <td className="px-6 py-4 font-mono text-green-600">
                            PKR {paidFees.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 font-mono text-red-600">
                            PKR {pendingFees.toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColor}`}>
                              {status}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                <p>No students enrolled in this course yet.</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {coursesWithFees.length === 0 && (
        <div className="text-center py-12 bg-white border rounded-lg">
          <p className="text-gray-500 text-lg">No courses found.</p>
        </div>
      )}
    </div>
  )
}
