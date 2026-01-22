// app/admin/schedule/slot-card.tsx
'use client'

import { Users, LogOut, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

type Props = {
  data: {
    id: string
    course: { name: string; durationMonths: number }
    slot: { 
      startTime: Date
      endTime: Date
      days: string
      room: { name: string; capacity: number }
    }
    // 👇 FIX: We must allow 'null' here because Prisma returns null for active students
    enrollments: { 
      endDate: Date | null
      student: {
        id: string
        name: string
        phone: string
        fatherName: string
      }
    }[] 
    teacher?: { firstName: string | null } | null
  }
}

export function SlotCard({ data }: Props) {
  const [showStudents, setShowStudents] = useState(false)
  const totalStudents = data.enrollments.length
  const capacity = data.slot.room.capacity
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
            {new Date(data.slot.startTime).toLocaleTimeString([],{hour:'2-digit', minute:'2-digit'})} - 
            {new Date(data.slot.endTime).toLocaleTimeString([],{hour:'2-digit', minute:'2-digit'})}
          </p>
          <p className="text-xs text-gray-500">
            {data.slot.days}
          </p>
        </div>
        <div className={`text-xs font-bold px-2 py-1 rounded ${isFull ? 'bg-red-200 text-red-800' : 'bg-green-100 text-green-800'}`}>
          {isFull ? 'FULL' : 'OPEN'}
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
            Seat opens: <strong>{new Date(nextGraduation).toLocaleDateString()}</strong>
          </span>
        </div>
      ) : (
        !isFull && (
          <div className="text-xs text-green-600 font-medium flex items-center gap-1">
             +{capacity - totalStudents} Seats Available Now
          </div>
        )
      )}

      {/* Toggle Students Button */}
      {totalStudents > 0 && (
        <button
          onClick={() => setShowStudents(!showStudents)}
          className="w-full mt-3 flex items-center justify-center gap-2 text-xs text-blue-600 hover:text-blue-800 font-medium py-2 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
        >
          {showStudents ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {showStudents ? 'Hide' : 'Show'} Enrolled Students ({totalStudents})
        </button>
      )}

      {/* Enrolled Students List */}
      {showStudents && totalStudents > 0 && (
        <div className="mt-3 border-t pt-3">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">Enrolled Students:</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {data.enrollments.map((enrollment, index) => (
              <div key={enrollment.student.id} className="bg-gray-50 p-2 rounded text-xs">
                <div className="font-medium text-gray-900">{enrollment.student.name}</div>
                <div className="text-gray-600">Father: {enrollment.student.fatherName}</div>
                <div className="text-gray-600">Phone: {enrollment.student.phone}</div>
                {enrollment.endDate && (
                  <div className="text-gray-500 mt-1">
                    Ends: {new Date(enrollment.endDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}