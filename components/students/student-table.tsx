"use client"

import React from "react"
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
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Student records</h2>
          <p className="text-sm text-slate-500">Clean list view with quick access to profiles and SMS settings.</p>
        </div>
        <div className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
          {data.length} entries
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-white text-slate-500">
            <tr className="border-b border-slate-200">
              <th className="px-6 py-4 font-medium">Student</th>
              <th className="px-6 py-4 font-medium">Contact</th>
              <th className="px-6 py-4 font-medium">Joined</th>
              <th className="px-6 py-4 font-medium">SMS</th>
              <th className="px-6 py-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  No students found.
                </td>
              </tr>
            ) : data.map((student) => (
              <tr key={student.id} className="group transition hover:bg-slate-50/70">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/admin/students/${student.studentId}`} className="font-semibold text-slate-900 transition group-hover:text-slate-700">
                          {student.name}
                        </Link>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-mono text-[11px] font-semibold text-slate-600">
                          {student.studentId}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">Father: {student.fatherName}</p>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-5 text-slate-600">
                  <div className="space-y-1">
                    <p className="font-medium text-slate-900">{student.phone || 'No phone number'}</p>
                    <p className="text-xs text-slate-500">Student profile ready for follow-up</p>
                  </div>
                </td>

                <td className="px-6 py-5 text-slate-600">
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
                    <CalendarDays size={14} />
                    {new Date(student.admission).toLocaleDateString('en-US', {
                      timeZone: 'Asia/Karachi',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                </td>

                <td className="px-6 py-5">
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

                <td className="px-6 py-5 text-right">
                  <Link
                    href={`/admin/students/${student.studentId}`}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    View profile
                    <ArrowUpRight size={14} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
