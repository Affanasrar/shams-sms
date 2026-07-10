// app/admin/enrollment/enrollment-filters.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Filter, Search, X } from 'lucide-react'
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
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Filter size={16} className="text-indigo-600" />
        Filter enrollments
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.9fr_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name or ID..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-2xl border border-slate-300 bg-white/90 py-2.5 pl-10 pr-3 text-sm text-slate-700 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <select
          value={currentCourse}
          onChange={(e) => handleFilterChange('courseId', e.target.value)}
          className="w-full rounded-2xl border border-slate-300 bg-white/90 px-3 py-2.5 text-sm text-slate-700 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="">All Courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          value={currentSlot}
          onChange={(e) => handleFilterChange('slotId', e.target.value)}
          className="w-full rounded-2xl border border-slate-300 bg-white/90 px-3 py-2.5 text-sm text-slate-700 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="">All Slots / Rooms</option>
          {slots.map((s) => (
            <option key={s.id} value={s.id}>
              {s.days} • {new Date(s.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })} ({s.room.name})
            </option>
          ))}
        </select>

        {(currentCourse || currentSlot || searchInput) && (
          <button
            onClick={() => {
              setSearchInput('')
              router.push('/admin/enrollment')
            }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <X size={14} />
            Clear
          </button>
        )}
      </div>
    </div>
  )
}