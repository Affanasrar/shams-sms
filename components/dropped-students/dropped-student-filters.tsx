'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Filter, Search } from 'lucide-react'
import { useState } from 'react'

type Props = {
  courses: { id: string; name: string }[]
}

export function DroppedStudentFilters({ courses }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentCourse = searchParams.get('courseId') || ''
  const currentSearch = searchParams.get('search') || ''
  const currentSort = searchParams.get('sort') || 'recent'
  const [searchInput, setSearchInput] = useState(currentSearch)

  // Update the URL when a dropdown is changed
  function handleFilterChange(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/admin/dropped-students?${params.toString()}`)
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
    router.push(`/admin/dropped-students?${params.toString()}`)
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
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Sort Filter */}
        <select
          value={currentSort}
          onChange={(e) => handleFilterChange('sort', e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black min-w-[200px]"
        >
          <option value="recent">Most Recent Drops</option>
          <option value="oldest">Oldest Drops</option>
          <option value="name">Student Name (A-Z)</option>
        </select>

        {/* Reset Button */}
        {(currentCourse || searchInput || currentSort !== 'recent') && (
          <button
            onClick={() => {
              setSearchInput('')
              router.push('/admin/dropped-students')
            }}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition font-medium text-sm"
          >
            Reset Filters
          </button>
        )}
      </div>
    </div>
  )
}
