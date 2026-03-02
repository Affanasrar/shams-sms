// app/admin/fees/fees-filters.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Filter, Search, X } from 'lucide-react'
import { useState } from 'react'

export function FeesFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentSearch = searchParams.get('search') || ''
  const [searchInput, setSearchInput] = useState(currentSearch)

  // Handle search input change
  function handleSearchChange(value: string) {
    setSearchInput(value)
    const params = new URLSearchParams(searchParams.toString())
    if (value && value.trim()) {
      params.set('search', value.trim())
    } else {
      params.delete('search')
    }
    router.push(`/admin/fees?${params.toString()}`)
  }

  // Clear all filters
  function handleClearFilters() {
    setSearchInput('')
    router.push('/admin/fees')
  }

  return (
    <div className="bg-white p-4 rounded-lg border shadow-sm space-y-4">
      <div className="flex items-center gap-2 text-gray-500 font-medium">
        <Filter size={18} /> Filters:
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        {/* Search by Student Name, ID, or Father's Name */}
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by student name, ID, or father's name..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full border border-gray-300 rounded-md pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        {/* Reset Button */}
        {searchInput && (
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition"
          >
            <X size={16} />
            Clear
          </button>
        )}
      </div>
    </div>
  )
}
