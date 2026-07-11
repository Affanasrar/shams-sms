'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'

export type ReceptionistEnrollmentRow = {
  id: string
  enrollmentId: string
  studentId: string
  studentName: string
  fatherName: string
  phone: string
  courseName: string
  slotDays: string
  slotTime: string
  roomName: string
  joiningDate: string
}

interface ReceptionistEnrollmentListProps {
  enrollments: ReceptionistEnrollmentRow[]
}

export function ReceptionistEnrollmentList({ enrollments }: ReceptionistEnrollmentListProps) {
  const [query, setQuery] = useState('')
  const [activeQuery, setActiveQuery] = useState('')

  const filteredEnrollments = useMemo(() => {
    const term = activeQuery.trim().toLowerCase()
    if (!term) return enrollments
    return enrollments.filter((enrollment) =>
      enrollment.studentId.toLowerCase().includes(term) ||
      enrollment.studentName.toLowerCase().includes(term) ||
      enrollment.fatherName.toLowerCase().includes(term) ||
      enrollment.courseName.toLowerCase().includes(term) ||
      enrollment.roomName.toLowerCase().includes(term) ||
      enrollment.slotDays.toLowerCase().includes(term)
    )
  }, [activeQuery, enrollments])

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/80 p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">Enrollment list</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Active enrollments</h2>
              <p className="mt-2 text-sm text-slate-500">Search active enrollments by student, course, room, or schedule.</p>
            </div>

            <div className="flex flex-1 items-center gap-3 xl:flex-none">
              <label className="relative flex-1 xl:w-[30rem]">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      setActiveQuery(query)
                    }
                  }}
                  placeholder="Search student, course, or room"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm shadow-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                />
              </label>
              <button
                type="button"
                onClick={() => setActiveQuery(query)}
                className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Search
              </button>
            </div>
          </div>

          {activeQuery && (
            <div className="mt-4 inline-flex items-center rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1.5 text-sm text-cyan-800">
              Filtering by <span className="ml-2 font-semibold">{activeQuery}</span>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.22em]">Student</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.22em]">Course</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.22em]">Slot</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.22em]">Room</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.22em]">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEnrollments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-500">
                    No enrollments match your search.
                  </td>
                </tr>
              ) : (
                filteredEnrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="transition hover:bg-slate-50/70">
                    <td className="px-6 py-4 align-top text-sm">
                      <div className="font-semibold text-slate-950">{enrollment.studentName}</div>
                      <div className="text-xs text-slate-500">{enrollment.fatherName}</div>
                      <div className="mt-2 text-xs font-mono text-slate-400">{enrollment.studentId}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">{enrollment.courseName}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{enrollment.slotDays} • {enrollment.slotTime}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{enrollment.roomName}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{new Date(enrollment.joiningDate).toLocaleDateString('en-US', { timeZone: 'Asia/Karachi' })}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
