// app/admin/schedule/slot-card.tsx
'use client'

import { Users, LogOut, Edit, Trash2, ExternalLink, Clock3, MapPin, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { changeTeacherForm, deleteAssignmentForm } from '@/app/actions/settings'
import Link from 'next/link'
import { getSlotSeatSummary, formatSlotTimeRange } from '@/lib/seat-engine'

type Props = {
  data: {
    id: string
    course: { name: string; durationMonths: number }
    slot: { 
      startTime: Date | string
      endTime: Date | string
      days: string
      room: { name: string; capacity: number; id?: string }
    }
    enrollments: { 
      endDate?: Date | string | null
      student: {
        id: string
        name: string
        phone?: string
        fatherName?: string
      }
    }[] 
    teacher?: { id: string; firstName: string | null; lastName: string | null } | null
  }
  teachers: any[]
}

export function SlotCard({ data, teachers, slotOccupancy }: Props & { slotOccupancy?: number }) {
  const [isEditingTeacher, setIsEditingTeacher] = useState(false)
  
  const enrollmentsInThisCourse = data.enrollments.length
  const totalEnrollmentsInSlot = slotOccupancy ?? enrollmentsInThisCourse
  const enrollmentsInOtherCourses = totalEnrollmentsInSlot - enrollmentsInThisCourse
  const effectiveCapacity = Math.max(0, data.slot.room.capacity - enrollmentsInOtherCourses)
  
  const seatInfo = getSlotSeatSummary(effectiveCapacity, data.enrollments, {
    id: data.id,
    roomName: data.slot.room.name,
    days: data.slot.days,
    startTime: data.slot.startTime,
    endTime: data.slot.endTime
  })

  const isFull = seatInfo.status === 'FULL'
  const isAlmostFull = seatInfo.status === 'ALMOST_FULL'
  const totalStudents = enrollmentsInThisCourse
  const capacity = effectiveCapacity

  return (
    <div className={`rounded-[24px] border p-4 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_50px_-24px_rgba(59,130,246,0.3)] ${isFull ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50/80 dark:bg-rose-950/20' : 'border-border bg-card/90 '}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            <div className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] ${isFull ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' : isAlmostFull ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'}`}>
              {isFull ? 'Full' : `${seatInfo.availableSeats} Open`}
            </div>
            <div className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              {data.slot.days}
            </div>
          </div>
          <h3 className="truncate text-[15px] font-semibold text-foreground" title={data.course.name}>
            {data.course.name}
          </h3>
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Clock3 size={14} />
            <span>
              {formatSlotTimeRange(data.slot.startTime, data.slot.endTime)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setIsEditingTeacher(true)} className="rounded-xl p-1.5 text-muted-foreground transition hover:bg-muted hover:text-indigo-600 dark:text-indigo-300" title="Change Teacher">
            <Edit size={14} />
          </button>
          <form action={deleteAssignmentForm} className="inline">
            <input type="hidden" name="id" value={data.id} />
            <button type="submit" className="rounded-xl p-1.5 text-muted-foreground transition hover:bg-rose-50 dark:bg-rose-950/40 hover:text-rose-600 dark:text-rose-300" title="Delete Assignment" onClick={(e) => { if (!confirm('Are you sure you want to delete this course assignment? This will remove all enrollments.')) { e.preventDefault() } }}>
              <Trash2 size={14} />
            </button>
          </form>
        </div>
      </div>

      <div className="mb-4 rounded-2xl bg-muted/90 p-3 text-sm text-muted-foreground ">
        <div className="mb-2 flex items-center gap-2">
          <MapPin size={14} className="text-indigo-600 dark:text-indigo-300" />
          <span className="font-medium text-foreground ">{data.slot.room.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-sky-600 dark:text-sky-300" />
          <span>{data.teacher?.firstName ? `${data.teacher.firstName} ${data.teacher.lastName || ''}`.trim() : 'No teacher assigned'}</span>
        </div>
      </div>

      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between text-sm font-medium text-foreground">
          <span className="flex items-center gap-1.5"><Users size={14} /> Capacity</span>
          <span>{totalStudents}/{capacity}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className={`h-full rounded-full transition-all ${isFull ? 'bg-rose-500' : isAlmostFull ? 'bg-amber-500' : 'bg-gradient-to-r from-indigo-500 to-sky-500'}`} style={{ width: `${seatInfo.occupancyPercent}%` }} />
        </div>
      </div>

      {isFull && seatInfo.nextVacancyDate ? (
        <div className="mb-3 flex items-start gap-2 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-card/70 p-2.5 text-sm text-rose-700 dark:text-rose-300">
          <LogOut size={13} className="mt-0.5 shrink-0" />
          <span>Next seat opens <strong>{new Date(seatInfo.nextVacancyDate).toLocaleDateString('en-US', { timeZone: 'Asia/Karachi', month: 'short', day: 'numeric', year: 'numeric' })}</strong></span>
        </div>
      ) : !isFull && (
        <div className="mb-3 flex items-center gap-2 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/80 p-2.5 text-sm font-medium text-emerald-700 dark:text-emerald-300">
          <Sparkles size={13} />
          <span>{seatInfo.availableSeats} seats available now</span>
        </div>
      )}

      {totalStudents > 0 && (
        <Link href={`/admin/schedule/${data.id}/students`} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-slate-950 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800">
          <ExternalLink size={14} />
          View enrolled students ({totalStudents})
        </Link>
      )}

 {/* Teacher Edit Modal */}
 {isEditingTeacher && (
 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
 <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full shadow-xl">
 <h3 className="text-lg font-semibold mb-4 text-foreground ">Change Teacher for {data.course.name}</h3>
 <form action={changeTeacherForm} className="space-y-4">
 <input type="hidden" name="assignmentId" value={data.id} />
 <div>
 <label className="block text-sm font-medium text-foreground mb-2">Select New Teacher</label>
 <select
 name="teacherId"
 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
 required
 >
 <option value="">-- Choose Teacher --</option>
 {teachers.map((teacher: any) => (
 <option key={teacher.id} value={teacher.id}>
 {teacher.firstName} {teacher.lastName}
 </option>
 ))}
 </select>
 </div>
 <div className="flex gap-2">
 <button
 type="submit"
 className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
 >
 Change Teacher
 </button>
 <button
 type="button"
 onClick={() => setIsEditingTeacher(false)}
 className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 "
 >
 Cancel
 </button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 )
}