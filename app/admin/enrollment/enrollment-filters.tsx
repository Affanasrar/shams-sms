// app/admin/enrollment/enrollment-filters.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Filter, Search } from 'lucide-react'
import { useState } from 'react'

type Props = {
  courses: { id: string; name: string }[]
  slots: { id: string; startTime: Date; days: string; room: { name: string } }[]
}

export function EnrollmentFilters({ courses, slots }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentCourse = searchParams.get('courseId') || ''
  const currentSlot = searchParams.get('slotId') || ''
  const currentSearch = searchParams.get('search') || ''
  const [searchInput, setSearchInput] = useState(currentSearch)

  // Update the URL when a dropdown is changed
  function handleFilterChange(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
      // If changing course, clear slot selection since slots are filtered by course
      if (key === 'courseId') {
        params.delete('slotId')
      }
    } else {
      params.delete(key)
    }
    router.push(`/admin/enrollment?${params.toString()}`)
  }

  // Handle search input change
  function handleSearchChange(value: string) {
    setSearchInput(value)
    const params = new URLSearchParams(searchParams.toString())
    if (value && value.trim()) {
      params.set('search', value.trim())
    } else {
      params.delete('search')
    }
    router.push(`/admin/enrollment?${params.toString()}`)
  }

  return (
    <div className="bg-white p-4 rounded-lg border shadow-sm space-y-4">
      <div className="flex items-center gap-2 text-gray-500 font-medium">
        <Filter size={18} /> Filters:
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        {/* Search by Name or ID */}
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by student name or ID..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full border border-gray-300 rounded-md pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
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
              {s.days} • {new Date(s.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })} ({s.room.name})
            </option>
          ))}
        </select>

        {/* Reset Button */}
        {(currentCourse || currentSlot || searchInput) && (
          <button
            onClick={() => {
              setSearchInput('')
              router.push('/admin/enrollment')
            }}
            className="text-sm text-red-600 hover:underline font-medium whitespace-nowrap"
          >
            Clear All
          </button>
        )}
      </div>
    </div>
  )
}