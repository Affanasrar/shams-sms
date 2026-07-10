// app/admin/students/student-filters.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Filter, Search, X } from 'lucide-react'
import { useState } from 'react'

export function StudentFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentSearch = searchParams.get('q') || ''
  const [searchInput, setSearchInput] = useState(currentSearch)

  // Handle search input change
  function handleSearchChange(value: string) {
    setSearchInput(value)
    const params = new URLSearchParams(searchParams.toString())
    if (value && value.trim()) {
      params.set('q', value.trim())
    } else {
      params.delete('q')
    }
    router.push(`/admin/students?${params.toString()}`)
  }

  // Clear all filters
  function handleClearFilters() {
    setSearchInput('')
    router.push('/admin/students')
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
            <Filter size={14} /> Filters
          </div>
          <p className="mt-2 text-sm text-slate-500">Search by name, ID, phone, or father&apos;s name.</p>
        </div>

        <div className="flex w-full flex-col gap-3 lg:max-w-2xl lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search students..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
            />
          </div>

          {searchInput && (
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <X size={16} />
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
