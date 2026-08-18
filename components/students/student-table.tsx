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
 <div className="card-surface overflow-hidden ">
 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border bg-muted px-6 py-4">
 <div>
 <h2 className="text-lg font-semibold text-foreground ">Student Records</h2>
 <p className="text-sm text-muted-foreground ">Clean list view with quick access to profiles and SMS settings.</p>
 </div>
 <div className="rounded-full bg-slate-900 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
 {data.length} Total
 </div>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full text-left text-sm">
 <thead className="bg-card text-muted-foreground ">
 <tr className="border-b border-border ">
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
 <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground ">
 No students found matching your criteria.
 </td>
 </tr>
 ) : currentData.map((student) => (
 <tr key={student.id} className="group transition hover:bg-muted/70 ">
 <td className="px-6 py-4">
 <div className="flex items-center gap-4">
 <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-sm font-semibold text-white">
 {student.name.charAt(0).toUpperCase()}
 </div>
 <div className="min-w-0">
 <div className="flex flex-wrap items-center gap-2">
 <Link href={`/admin/students/${student.studentId}`} className="font-semibold text-foreground transition group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
 {student.name}
 </Link>
 <span className="rounded-full bg-muted px-2.5 py-0.5 font-mono text-[11px] font-semibold text-muted-foreground ">
 {student.studentId}
 </span>
 </div>
 <p className="text-xs text-muted-foreground ">Father: {student.fatherName}</p>
 </div>
 </div>
 </td>

 <td className="px-6 py-4 text-muted-foreground ">
 <div className="space-y-0.5">
 <p className="font-medium text-foreground ">{student.phone || 'No phone number'}</p>
 </div>
 </td>

 <td className="px-6 py-4 text-muted-foreground ">
 <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground ">
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
 className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground transition hover:bg-muted "
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
 <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border px-6 py-4 text-sm text-muted-foreground ">
 <div>
 Showing <span className="font-semibold text-foreground ">{startIndex + 1}</span> to{' '}
 <span className="font-semibold text-foreground ">{endIndex}</span> of{' '}
 <span className="font-semibold text-foreground ">{data.length}</span> students
 </div>

 <div className="flex items-center gap-2">
 <button
 onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
 disabled={currentPage === 1}
 className="px-3 py-1.5 rounded-lg border border-border bg-card text-foreground disabled:opacity-40 text-xs font-medium transition hover:bg-muted"
 >
 Previous
 </button>
 <span className="text-xs font-medium px-2 text-foreground ">
 Page {currentPage} of {totalPages}
 </span>
 <button
 onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
 disabled={currentPage >= totalPages}
 className="px-3 py-1.5 rounded-lg border border-border bg-card text-foreground disabled:opacity-40 text-xs font-medium transition hover:bg-muted"
 >
 Next
 </button>
 </div>
 </div>
 )}
 </div>
 )
}
