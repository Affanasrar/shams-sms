// app/admin/enrollment/enrollment-filters.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Filter } from 'lucide-react'

type Props = {
  courses: { id: string; name: string }[]
  slots: { id: string; startTime: Date; days: string; room: { name: string } }[]
}

export function EnrollmentFilters({ courses, slots }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentCourse = searchParams.get('courseId') || ''
  const currentSlot = searchParams.get('slotId') || ''

  // Update the URL when a dropdown is changed
  function handleFilterChange(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/admin/enrollment?${params.toString()}`)
  }

  return (
    <div className="bg-white p-4 rounded-lg border shadow-sm flex flex-wrap gap-4 items-center">
      <div className="flex items-center gap-2 text-gray-500 font-medium">
        <Filter size={18} /> Filters:
      </div>

      {/* Course Filter */}
      <select
        value={currentCourse}
        onChange={(e) => handleFilterChange('courseId', e.target.value)}
        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black min-w-[200px]"
      >
        <option value="">All Courses</option>
        {courses.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      {/* Slot Filter */}
      <select
        value={currentSlot}
        onChange={(e) => handleFilterChange('slotId', e.target.value)}
        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black min-w-[250px]"
      >
        <option value="">All Slots / Rooms</option>
        {slots.map(s => (
          <option key={s.id} value={s.id}>
            {s.days} • {new Date(s.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} ({s.room.name})
          </option>
        ))}
      </select>

      {/* Reset Button */}
      {(currentCourse || currentSlot) && (
        <button
          onClick={() => router.push('/admin/enrollment')}
          className="text-sm text-red-600 hover:underline ml-auto font-medium"
        >
          Clear Filters
        </button>
      )}
    </div>
  )
}