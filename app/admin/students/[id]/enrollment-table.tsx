'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { ExtendCourseModal } from './extend-course-modal'

interface Enrollment {
  id: string
  joiningDate: Date
  endDate: Date | null
  extendedDays: number
  status: string
  courseOnSlot: {
    course: {
      name: string
      durationMonths: number
    }
    slot: {
      days: string
      startTime: Date
    }
  }
}

interface EnrollmentTableProps {
  enrollments: Enrollment[]
}

function StatusBadge({ status }: { status: string }) {
  const statusStyles = {
    ACTIVE: 'bg-green-100 text-green-800',
    COMPLETED: 'bg-blue-100 text-blue-800',
    DROPPED: 'bg-red-100 text-red-800'
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  )
}

export function EnrollmentTable({ enrollments }: EnrollmentTableProps) {
  const [selectedEnrollment, setSelectedEnrollment] = useState<{ id: string; courseName: string } | null>(null)

  return (
    <>
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4">Course</th>
              <th className="p-4">Slot</th>
              <th className="p-4">Joining Date</th>
              <th className="p-4">End Date</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {enrollments.map(enr => {
              // Calculate end date: joining date + course duration months + extended days
              const joiningDate = new Date(enr.joiningDate)
              const courseDurationMs = enr.courseOnSlot.course.durationMonths * 30 * 24 * 60 * 60 * 1000 // Approximate months to ms
              const extendedDaysMs = (enr.extendedDays || 0) * 24 * 60 * 60 * 1000
              const calculatedEndDate = new Date(joiningDate.getTime() + courseDurationMs + extendedDaysMs)
              const actualEndDate = enr.endDate ? new Date(enr.endDate) : calculatedEndDate

              return (
                <tr key={enr.id}>
                  <td className="p-4 font-medium">{enr.courseOnSlot.course.name}</td>
                  <td className="p-4 text-gray-500">
                    {enr.courseOnSlot.slot.days} <br/>
                    {new Date(enr.courseOnSlot.slot.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })}
                  </td>
                  <td className="p-4 text-sm">
                    {joiningDate.toLocaleDateString('en-US', { timeZone: 'Asia/Karachi' })}
                  </td>
                  <td className="p-4 text-sm">
                    {actualEndDate.toLocaleDateString('en-US', { timeZone: 'Asia/Karachi' })}
                    {enr.extendedDays > 0 && (
                      <span className="text-orange-600 text-xs block">
                        +{enr.extendedDays} days extended
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <StatusBadge status={enr.status} />
                  </td>
                  <td className="p-4">
                    {enr.status === 'ACTIVE' && (
                      <button
                        onClick={() => setSelectedEnrollment({ id: enr.id, courseName: enr.courseOnSlot.course.name })}
                        className="inline-flex items-center gap-1.5 text-blue-600 hover:text-white hover:bg-blue-600 px-3 py-1.5 rounded-md transition-all font-medium text-xs border border-transparent hover:border-blue-700"
                        title="Extend Course Duration"
                      >
                        <Plus size={14} /> Extend
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <ExtendCourseModal
        enrollmentId={selectedEnrollment?.id || ''}
        courseName={selectedEnrollment?.courseName || ''}
        isOpen={!!selectedEnrollment}
        onClose={() => setSelectedEnrollment(null)}
      />
    </>
  )
}