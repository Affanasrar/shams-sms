"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Switch } from "@/components/ui/switch"
import { ArrowUpRight, CalendarDays } from "lucide-react"
import { StatusBadge } from "@/components/ui/status-badge"

export interface StudentRow {
  id: string
  studentId: string
  name: string
  fatherName: string
  phone: string | null
  admission: Date
  smsReminderEnabled: boolean
}

interface StudentTableProps {
  data: StudentRow[]
}

export function StudentTable({ data }: StudentTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 25

  const totalPages = Math.ceil(data.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, data.length)
  const currentData = data.slice(startIndex, endIndex)

  return (
    <div className="card-surface overflow-hidden dark:bg-slate-900/80 dark:border-slate-800">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Student Records</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Clean list view with quick access to profiles and SMS settings.</p>
        </div>
        <div className="rounded-full bg-slate-900 dark:bg-slate-800 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
          {data.length} Total
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400">
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="px-6 py-4 font-medium">Student</th>
              <th className="px-6 py-4 font-medium">Contact</th>
              <th className="px-6 py-4 font-medium">Joined</th>
              <th className="px-6 py-4 font-medium">SMS</th>
              <th className="px-6 py-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                  No students found matching your criteria.
                </td>
              </tr>
            ) : currentData.map((student) => (
              <tr key={student.id} className="group transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-sm font-semibold text-white">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/admin/students/${student.studentId}`} className="font-semibold text-slate-900 dark:text-white transition group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {student.name}
                        </Link>
                        <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                          {student.studentId}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Father: {student.fatherName}</p>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                  <div className="space-y-0.5">
                    <p className="font-medium text-slate-900 dark:text-white">{student.phone || 'No phone number'}</p>
                  </div>
                </td>

                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                    <CalendarDays size={14} />
                    {new Date(student.admission).toLocaleDateString('en-US', {
                      timeZone: 'Asia/Karachi',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={student.smsReminderEnabled ? 'ACTIVE' : 'INACTIVE'} />
                    <Switch
                      checked={student.smsReminderEnabled}
                      onCheckedChange={async (checked) => {
                        try {
                          const response = await fetch(`/api/admin/students/${student.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ smsReminderEnabled: checked })
                          })
                          if (!response.ok) {
                            throw new Error('Failed to update')
                          }
                          window.location.reload()
                        } catch (error) {
                          console.error('Error updating SMS reminder setting:', error)
                          alert('Failed to update SMS reminder setting')
                        }
                      }}
                    />
                  </div>
                </td>

                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/admin/students/${student.studentId}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    View Profile
                    <ArrowUpRight size={14} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {data.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-800 px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
          <div>
            Showing <span className="font-semibold text-slate-900 dark:text-white">{startIndex + 1}</span> to{' '}
            <span className="font-semibold text-slate-900 dark:text-white">{endIndex}</span> of{' '}
            <span className="font-semibold text-slate-900 dark:text-white">{data.length}</span> students
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 disabled:opacity-40 text-xs font-medium transition hover:bg-slate-50"
            >
              Previous
            </button>
            <span className="text-xs font-medium px-2 text-slate-900 dark:text-white">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 disabled:opacity-40 text-xs font-medium transition hover:bg-slate-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
