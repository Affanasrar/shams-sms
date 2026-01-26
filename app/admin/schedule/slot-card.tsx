// app/admin/schedule/slot-card.tsx
'use client'

import { Users, LogOut, Edit, Trash2, ExternalLink } from 'lucide-react'
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
    <div className={`p-4 rounded-lg border shadow-sm transition-all hover:shadow-md ${isFull ? 'bg-red-50 border-red-200' : 'bg-white hover:border-blue-300'}`}>
      
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 line-clamp-1" title={data.course.name}>
            {data.course.name}
          </h3>
          <p className="text-xs text-gray-500">
            {new Date(data.slot.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })} -
            {new Date(data.slot.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })}
          </p>
          <p className="text-xs text-gray-500">
            {data.slot.days}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`text-xs font-bold px-2 py-1 rounded ${isFull ? 'bg-red-200 text-red-800' : 'bg-green-100 text-green-800'}`}>
            {isFull ? 'FULL' : 'OPEN'}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setIsEditingTeacher(true)}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
              title="Change Teacher"
            >
              <Edit size={14} />
            </button>
            <form action={deleteAssignmentForm} className="inline">
              <input type="hidden" name="id" value={data.id} />
              <button
                type="submit"
                className="p-1 text-red-600 hover:bg-red-50 rounded"
                title="Delete Assignment"
                onClick={(e) => {
                  if (!confirm('Are you sure you want to delete this course assignment? This will remove all enrollments.')) {
                    e.preventDefault()
                  }
                }}
              >
                <Trash2 size={14} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Teacher & Room */}
      <div className="text-xs text-gray-600 mb-3 space-y-1">
        <p>👨‍🏫 {data.teacher?.firstName || "No Teacher"}</p>
        <p>📍 {data.slot.room.name}</p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1 mb-3">
        <div className="flex justify-between text-xs font-medium text-gray-700">
          <span className="flex items-center gap-1"><Users size={12}/> Students</span>
          <span>{totalStudents} / {capacity}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
          <div 
            className={`h-full rounded-full ${isFull ? 'bg-red-500' : 'bg-blue-500'}`} 
            style={{ width: `${occupancyPercent}%` }}
          />
        </div>
      </div>

      {/* Next Vacancy Info */}
      {isFull && nextGraduation ? (
        <div className="bg-white/50 p-2 rounded border border-red-100 text-xs text-red-700 flex items-start gap-2">
          <LogOut size={12} className="mt-0.5 shrink-0"/>
          <span>
            Seat opens: <strong>{new Date(nextGraduation).toLocaleDateString('en-US', { timeZone: 'Asia/Karachi' })}</strong>
          </span>
        </div>
      ) : (
        !isFull && (
          <div className="text-xs text-green-600 font-medium flex items-center gap-1">
             +{capacity - totalStudents} Seats Available Now
          </div>
        )
      )}

      {/* View Students Button */}
      {totalStudents > 0 && (
        <Link
          href={`/admin/schedule/${data.id}/students`}
          className="w-full mt-3 flex items-center justify-center gap-2 text-xs text-blue-600 hover:text-blue-800 font-medium py-2 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
        >
          <ExternalLink size={14} />
          View Enrolled Students ({totalStudents})
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