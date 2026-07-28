"use client"

import React, { useState } from "react"
import { EnrollmentRowActions } from "@/app/admin/enrollment/enrollment-row-actions"
import { CalendarDays } from "lucide-react"

export interface EnrollmentRow {
  id: string
  studentId: string
  studentName: string
  fatherName: string
  courseName: string
  slotDays: string
  slotStartTime: Date
  slotRoom: string
  joiningDate: Date
  status: string
  currentSlotId: string
  currentCourseOnSlotId: string
  currentTiming: {
    days: string
    startTime: Date
    endTime: Date
    room: string
  }
  availableSlotsForCourse: Array<{
    id: string
    days: string
    startTime: Date
    endTime: Date
    room: { name: string; capacity: number }
    enrollmentCount: number
  }>
}

interface EnrollmentTableProps {
  data: EnrollmentRow[]
}

const PAGE_SIZE = 25

export function EnrollmentTable({ data }: EnrollmentTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [globalFilter, setGlobalFilter] = useState('')

  const filtered = globalFilter.trim()
    ? data.filter(r =>
        r.studentName.toLowerCase().includes(globalFilter.toLowerCase()) ||
        r.studentId.toLowerCase().includes(globalFilter.toLowerCase()) ||
        r.courseName.toLowerCase().includes(globalFilter.toLowerCase())
      )
    : data

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const start = (currentPage - 1) * PAGE_SIZE
  const pageData = filtered.slice(start, start + PAGE_SIZE)

  return (
    <div className="space-y-4">
      {/* Search */}
      <input
        type="text"
        value={globalFilter}
        onChange={e => { setGlobalFilter(e.target.value); setCurrentPage(1) }}
        placeholder="Search student name, ID, or course…"
        className="w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2 text-sm text-slate-900 dark:text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 placeholder:text-slate-400"
      />

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <tr>
              <th className="px-5 py-3.5">Student</th>
              <th className="px-5 py-3.5">Course & Slot</th>
              <th className="px-5 py-3.5">Enrolled</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                  No enrollments found.
                </td>
              </tr>
            ) : (
              pageData.map(row => (
                <tr key={row.id} className="group transition hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  {/* Student */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white">
                        {row.studentName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">{row.studentName}</p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full">
                            {row.studentId}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 truncate">s/o {row.fatherName}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Course & Slot */}
                  <td className="px-5 py-4">
                    <div className="space-y-1.5">
                      <span className="inline-block rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/40 px-2.5 py-1 text-xs font-bold text-blue-800 dark:text-blue-300 max-w-[200px] truncate">
                        {row.courseName}
                      </span>
                      <div className="flex flex-wrap items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{row.slotDays}</span>
                        <span>·</span>
                        <span>
                          {new Date(row.slotStartTime).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                            timeZone: "Asia/Karachi",
                          })}
                        </span>
                        <span>·</span>
                        <span>{row.slotRoom}</span>
                      </div>
                    </div>
                  </td>

                  {/* Joining date */}
                  <td className="px-5 py-4">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                      <CalendarDays size={12} />
                      {new Date(row.joiningDate).toLocaleDateString("en-US", {
                        timeZone: "Asia/Karachi",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 text-right">
                    <EnrollmentRowActions
                      enrollmentId={row.id}
                      studentName={row.studentName}
                      courseName={row.courseName}
                      status={row.status}
                      currentCourseOnSlotId={row.currentCourseOnSlotId}
                      currentTiming={row.currentTiming}
                      availableSlotsForCourse={row.availableSlotsForCourse}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 text-sm text-slate-600 dark:text-slate-400">
          <p>
            Showing <span className="font-semibold text-slate-900 dark:text-white">{start + 1}</span> to{' '}
            <span className="font-semibold text-slate-900 dark:text-white">{Math.min(start + PAGE_SIZE, filtered.length)}</span> of{' '}
            <span className="font-semibold text-slate-900 dark:text-white">{filtered.length}</span> enrollments
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-medium disabled:opacity-40 transition hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Previous
            </button>
            <span className="text-xs font-medium text-slate-900 dark:text-white px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-medium disabled:opacity-40 transition hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
