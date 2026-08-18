'use client'

import React from 'react'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { DroppedStudentRowActions } from './dropped-student-row-actions'
import { format, formatDistance } from 'date-fns'

export interface DroppedStudentRow {
 id: string
 enrollmentId: string
 studentId: string
 studentName: string
 fatherName: string
 courseName: string
 slotDays: string
 slotStartTime: Date
 slotRoom: string
 joiningDate: Date
 droppedDate: Date
 endDate: Date
 extendedDays: number
 daysDropped: number
 phone?: string
 dropReason: 'duration' | 'admin'
 courseDurationMonths?: number
}

interface DroppedStudentTableProps {
 data: DroppedStudentRow[]
}

export function DroppedStudentTable({ data }: DroppedStudentTableProps) {
 const columns: ColumnDef<DroppedStudentRow, any>[] = [
 {
 accessorKey: 'studentName',
 header: 'Student Info',
 cell: (info) => {
 const row = info.row.original
 return (
 <div className="space-y-1">
 <div className="flex items-center gap-2">
 <span className="font-semibold text-foreground text-sm">{row.studentName}</span>
 <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-medium border border-indigo-200 dark:border-indigo-800/40">
 {row.studentId}
 </span>
 </div>
 <div className="text-xs text-muted-foreground ">
 S/o {row.fatherName} {row.phone ? `• ${row.phone}` : ''}
 </div>
 </div>
 )
 },
 },
 {
 accessorKey: 'courseName',
 header: 'Course & Slot',
 cell: (info) => {
 const row = info.row.original
 return (
 <div className="space-y-1">
 <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50">
 {row.courseName}
 </span>
 <div className="text-xs text-muted-foreground ">
 {row.slotDays} • {new Date(row.slotStartTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })} ({row.slotRoom})
 </div>
 </div>
 )
 },
 },
 {
 accessorKey: 'droppedDate',
 header: 'Drop Reason & Date',
 cell: (info) => {
 const row = info.row.original
 const date = new Date(row.droppedDate)
 return (
 <div className="space-y-1">
 <div className="flex items-center gap-2">
 {row.dropReason === 'duration' ? (
 <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
 📅 Duration Ended
 </span>
 ) : (
 <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40">
 🚫 Admin Dropped
 </span>
 )}
 </div>
 <div className="text-xs text-muted-foreground ">
 {format(date, 'MMM dd, yyyy')} ({formatDistance(date, new Date(), { addSuffix: true })})
 </div>
 </div>
 )
 },
 },
 {
 accessorKey: 'id',
 header: 'Actions',
 cell: (info) => (
 <DroppedStudentRowActions
 enrollmentId={info.row.original.enrollmentId}
 studentId={info.row.original.studentId}
 studentName={info.row.original.studentName}
 courseName={info.row.original.courseName}
 droppedDate={info.row.original.droppedDate}
 dropReason={info.row.original.dropReason}
 />
 ),
 },
 ]

 return (
 <div className="space-y-4">
 {/* Mobile Card View */}
 <div className="block md:hidden space-y-3">
 {data.map((row) => {
 const date = new Date(row.droppedDate)
 return (
 <div key={row.id} className="card-surface p-4 space-y-3 ">
 <div className="flex items-start justify-between gap-2">
 <div>
 <div className="font-bold text-foreground text-base">{row.studentName}</div>
 <div className="text-xs text-muted-foreground ">
 <span className="font-mono text-indigo-600 dark:text-indigo-400 font-medium">{row.studentId}</span> • S/o {row.fatherName}
 </div>
 </div>
 {row.dropReason === 'duration' ? (
 <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 shrink-0">
 📅 Course Ended
 </span>
 ) : (
 <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40 shrink-0">
 🚫 Admin Dropped
 </span>
 )}
 </div>

 <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground bg-muted p-2.5 rounded-xl">
 <div>
 <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Course & Slot</span>
 <span className="font-medium text-foreground ">{row.courseName}</span>
 <span className="block text-muted-foreground">{row.slotDays} ({row.slotRoom})</span>
 </div>
 <div>
 <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Dropped Date</span>
 <span className="font-medium text-foreground ">{format(date, 'MMM dd, yyyy')}</span>
 <span className="block text-muted-foreground">{formatDistance(date, new Date(), { addSuffix: true })}</span>
 </div>
 </div>

 <div className="pt-1 flex justify-end">
 <DroppedStudentRowActions
 enrollmentId={row.enrollmentId}
 studentId={row.studentId}
 studentName={row.studentName}
 courseName={row.courseName}
 droppedDate={row.droppedDate}
 dropReason={row.dropReason}
 />
 </div>
 </div>
 )
 })}
 </div>

 {/* Desktop Table View */}
 <div className="hidden md:block card-surface overflow-hidden ">
 <DataTable columns={columns} data={data} />
 </div>
 </div>
 )
}
