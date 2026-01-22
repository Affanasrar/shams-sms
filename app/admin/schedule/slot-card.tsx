// app/admin/schedule/slot-card.tsx
'use client'

import { Users, LogOut } from 'lucide-react'

type Props = {
  data: {
    id: string
    course: { name: string; durationMonths: number }
    slot: { 
      startTime: Date
      endTime: Date
      room: { name: string; capacity: number }
    }
    enrollments: { endDate: Date }[] // We only need endDate to calculate vacancies
    teacher?: { firstName: string } | null
  }
}

export function SlotCard({ data }: Props) {
  const totalStudents = data.enrollments.length
  const capacity = data.slot.room.capacity
  const isFull = totalStudents >= capacity
  
  // Calculate percentage for the progress bar
  const occupancyPercent = Math.min((totalStudents / capacity) * 100, 100)
  
  // Find the Next Vacancy (Earliest End Date of a current student)
  // We sort dates and pick the first one that is in the future
  const today = new Date()
  const nextGraduation = data.enrollments
    .map(e => new Date(e.endDate))
    .filter(d => d >= today)
    .sort((a, b) => a.getTime() - b.getTime())[0]

  return (
    <div className={`p-4 rounded-lg border shadow-sm transition-all hover:shadow-md ${isFull ? 'bg-red-50 border-red-200' : 'bg-white hover:border-blue-300'}`}>
      
      {/* Header: Course Name & Time */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-gray-900 line-clamp-1" title={data.course.name}>
            {data.course.name}
          </h3>
          <p className="text-xs text-gray-500">
            {new Date(data.slot.startTime).toLocaleTimeString([],{hour:'2-digit', minute:'2-digit'})} - 
            {new Date(data.slot.endTime).toLocaleTimeString([],{hour:'2-digit', minute:'2-digit'})}
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

      {/* Progress Bar (Capacity) */}
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
            Seat opens: <strong>{nextGraduation.toLocaleDateString()}</strong>
          </span>
        </div>
      ) : (
        !isFull && (
          <div className="text-xs text-green-600 font-medium flex items-center gap-1">
             +{capacity - totalStudents} Seats Available Now
          </div>
        )
      )}

    </div>
  )
}