// app/admin/schedule/slot-card.tsx
'use client'

import { Users, LogOut, Edit, Trash2, ExternalLink, Clock3, MapPin, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { changeTeacherForm, deleteAssignmentForm } from '@/app/actions/settings'
import Link from 'next/link'

type Props = {
  data: {
    id: string
    course: { name: string; durationMonths: number }
    slot: { 
      startTime: Date
      endTime: Date
      days: string
      room: { name: string; capacity: number; id: string }
    }
    enrollments: { 
      endDate: Date | null
      student: {
        id: string
        name: string
        phone: string
        fatherName: string
      }
    }[] 
    teacher?: { id: string; firstName: string | null; lastName: string | null } | null
  }
  teachers: any[]
}

export function SlotCard({ data, teachers, slotOccupancy }: Props & { slotOccupancy?: number }) {
  const [isEditingTeacher, setIsEditingTeacher] = useState(false)
  
  // Calculate shared capacity: effective capacity for this course is room capacity minus enrollments in other courses
  const enrollmentsInThisCourse = data.enrollments.length
  const totalEnrollmentsInSlot = slotOccupancy ?? enrollmentsInThisCourse
  const enrollmentsInOtherCourses = totalEnrollmentsInSlot - enrollmentsInThisCourse
  const effectiveCapacity = data.slot.room.capacity - enrollmentsInOtherCourses
  
  const totalStudents = enrollmentsInThisCourse
  const capacity = effectiveCapacity
  const isFull = totalStudents >= capacity
  
  const occupancyPercent = Math.min((totalStudents / capacity) * 100, 100)
  
  // Find the Next Vacancy
  const today = new Date()
  const nextGraduation = data.enrollments
    .map(e => e.endDate)
    // 👇 FIX: We filter out nulls so the rest of the code is safe
    .filter((d): d is Date => d !== null && new Date(d) >= today)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0]

  return (
    <div className={`rounded-[24px] border p-4 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_50px_-24px_rgba(59,130,246,0.3)] ${isFull ? 'border-rose-200 bg-rose-50/80' : 'border-slate-200 bg-white/90'}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            <div className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] ${isFull ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {isFull ? 'Full' : 'Open'}
            </div>
            <div className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-600">
              {data.slot.days}
            </div>
          </div>
          <h3 className="truncate text-[15px] font-semibold text-slate-900" title={data.course.name}>
            {data.course.name}
          </h3>
          <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
            <Clock3 size={14} />
            <span>
              {new Date(data.slot.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })} - {new Date(data.slot.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setIsEditingTeacher(true)} className="rounded-xl p-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-indigo-600" title="Change Teacher">
            <Edit size={14} />
          </button>
          <form action={deleteAssignmentForm} className="inline">
            <input type="hidden" name="id" value={data.id} />
            <button type="submit" className="rounded-xl p-1.5 text-slate-600 transition hover:bg-rose-50 hover:text-rose-600" title="Delete Assignment" onClick={(e) => { if (!confirm('Are you sure you want to delete this course assignment? This will remove all enrollments.')) { e.preventDefault() } }}>
              <Trash2 size={14} />
            </button>
          </form>
        </div>
      </div>

      <div className="mb-4 rounded-2xl bg-slate-50/90 p-3 text-sm text-slate-600">
        <div className="mb-2 flex items-center gap-2">
          <MapPin size={14} className="text-indigo-600" />
          <span className="font-medium text-slate-700">{data.slot.room.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-sky-600" />
          <span>{data.teacher?.firstName ? `${data.teacher.firstName} ${data.teacher.lastName || ''}`.trim() : 'No teacher assigned'}</span>
        </div>
      </div>

      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between text-sm font-medium text-slate-700">
          <span className="flex items-center gap-1.5"><Users size={14} /> Capacity</span>
          <span>{totalStudents}/{capacity}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <div className={`h-full rounded-full transition-all ${isFull ? 'bg-rose-500' : 'bg-gradient-to-r from-indigo-500 to-sky-500'}`} style={{ width: `${occupancyPercent}%` }} />
        </div>
      </div>

      {isFull && nextGraduation ? (
        <div className="mb-3 flex items-start gap-2 rounded-2xl border border-rose-200 bg-white/70 p-2.5 text-sm text-rose-700">
          <LogOut size={13} className="mt-0.5 shrink-0" />
          <span>Next seat opens <strong>{new Date(nextGraduation).toLocaleDateString('en-US', { timeZone: 'Asia/Karachi' })}</strong></span>
        </div>
      ) : !isFull && (
        <div className="mb-3 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-2.5 text-sm font-medium text-emerald-700">
          <Sparkles size={13} />
          <span>{capacity - totalStudents} seats available now</span>
        </div>
      )}

      {totalStudents > 0 && (
        <Link href={`/admin/schedule/${data.id}/students`} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-950 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800">
          <ExternalLink size={14} />
          View enrolled students ({totalStudents})
        </Link>
      )}

      {/* Teacher Edit Modal */}
      {isEditingTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Change Teacher for {data.course.name}</h3>
            <form action={changeTeacherForm} className="space-y-4">
              <input type="hidden" name="assignmentId" value={data.id} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select New Teacher</label>
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
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
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