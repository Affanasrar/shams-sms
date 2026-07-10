'use client'

import { useState } from 'react'
import { CalendarDays, Clock3, MapPin, Plus } from 'lucide-react'
import { ExtendCourseModal } from './extend-course-modal'

interface Enrollment {
  id: string
  joiningDate: string // ISO date string
  endDate: string | null // ISO date string
  extendedDays: number
  status: string
  courseOnSlot: {
    course: {
      name: string
      durationMonths: number
    }
    slot: {
      days: string
      startTime: string // ISO date string
      room?: {
        name: string
      }
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
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">Active enrollments</h3>
          <p className="text-sm text-slate-500">Courses, timing, and lifecycle status in one view.</p>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-white text-slate-500">
            <tr>
              <th className="px-6 py-4 font-medium">Course</th>
              <th className="px-6 py-4 font-medium">Timing</th>
              <th className="px-6 py-4 font-medium">Joining</th>
              <th className="px-6 py-4 font-medium">End Date</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {enrollments.map(enr => {
              // Calculate end date: joining date + course duration months + extended days
              const joiningDate = new Date(enr.joiningDate)
              const courseDurationMs = enr.courseOnSlot.course.durationMonths * 30 * 24 * 60 * 60 * 1000 // Approximate months to ms
              const extendedDaysMs = (enr.extendedDays || 0) * 24 * 60 * 60 * 1000
              const calculatedEndDate = new Date(joiningDate.getTime() + courseDurationMs + extendedDaysMs)
              const actualEndDate = enr.endDate ? new Date(enr.endDate) : calculatedEndDate

              return (
                <tr key={enr.id} className="transition hover:bg-slate-50/70">
                  <td className="px-6 py-5">
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-900">{enr.courseOnSlot.course.name}</p>
                      <p className="font-mono text-xs text-slate-500">{enr.id}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-slate-600">
                    <div className="space-y-1 rounded-2xl bg-slate-50 px-3 py-2">
                      <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-700">
                        <Clock3 size={14} />
                        {new Date(enr.courseOnSlot.slot.startTime).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                          timeZone: 'Asia/Karachi'
                        })}
                      </div>
                      <div className="inline-flex items-center gap-2 text-xs text-slate-500">
                        <MapPin size={14} />
                        {enr.courseOnSlot.slot.room?.name || 'Lab location'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-slate-600">
                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
                      <CalendarDays size={14} />
                      {joiningDate.toLocaleDateString('en-US', { timeZone: 'Asia/Karachi' })}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-slate-600">
                    {actualEndDate.toLocaleDateString('en-US', { timeZone: 'Asia/Karachi' })}
                    {enr.extendedDays > 0 && (
                      <span className="text-xs block text-orange-600">
                        +{enr.extendedDays} days extended
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <StatusBadge status={enr.status} />
                  </td>
                  <td className="px-6 py-5 text-right">
                    {enr.status === 'ACTIVE' && (
                      <button
                        onClick={() => setSelectedEnrollment({ id: enr.id, courseName: enr.courseOnSlot.course.name })}
                        className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
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