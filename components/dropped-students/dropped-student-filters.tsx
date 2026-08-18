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
 <div className="card-surface p-4 space-y-4 ">
 <div className="flex items-center gap-2 text-muted-foreground font-medium text-sm">
 <Filter size={18} className="text-indigo-600 dark:text-indigo-400" />
 <span>Filters & Search:</span>
 </div>

 <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-center">
 {/* Search by Name or ID */}
 <div className="relative flex-1 min-w-[240px] w-full">
 <Search className="absolute left-3 top-2.5 text-muted-foreground" size={18} />
 <input
 type="text"
 placeholder="Search student name or ID..."
 value={searchInput}
 onChange={(e) => handleSearchChange(e.target.value)}
 className="w-full rounded-xl border border-border bg-card pl-10 pr-3 py-2 text-sm outline-none focus:border-indigo-500 "
 />
 </div>

 {/* Course Filter */}
 <select
 value={currentCourse}
 onChange={(e) => handleFilterChange('courseId', e.target.value)}
 className="w-full sm:w-auto min-w-[180px] rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground outline-none focus:border-indigo-500 "
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
 className="w-full sm:w-auto min-w-[180px] rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground outline-none focus:border-indigo-500 "
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
 className="w-full sm:w-auto px-4 py-2 bg-muted hover:bg-muted text-foreground rounded-xl transition font-medium text-sm"
 >
 Reset Filters
 </button>
 )}
 </div>
 </div>
 )
}
