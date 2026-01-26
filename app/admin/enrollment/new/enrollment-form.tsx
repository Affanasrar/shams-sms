// app/admin/enrollment/new/enrollment-form.tsx
'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { enrollStudent } from '@/app/actions/enrollment' // The Logic from Module 3
import { useRouter } from 'next/navigation'
import { Search, Check } from 'lucide-react'

export function EnrollmentForm({ students, assignments }: any) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form State
  const [selectedStudent, setSelectedStudent] = useState('')
  const [selectedStudentData, setSelectedStudentData] = useState<any>(null)
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('')
  
  // Search State
  const [studentSearch, setStudentSearch] = useState('')
  const [showStudentDropdown, setShowStudentDropdown] = useState(false)
  
  // Ref for click outside detection
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowStudentDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 1. Filter Logic: Extract unique courses from assignments
  // We only want to show courses that actually have a slot assigned
  const uniqueCourses = Array.from(new Set(assignments.map((a: any) => JSON.stringify(a.course))))
    .map((s: any) => JSON.parse(s))

  // 2. Filter Logic: When a course is selected, show available time slots
  const availableSlots = assignments.filter((a: any) => a.courseId === selectedCourseId)

  // 3. Search Logic: Filter students based on search query
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return []
    
    const query = studentSearch.toLowerCase()
    return students.filter((student: any) => 
      student.studentId.toLowerCase().includes(query) ||
      student.name.toLowerCase().includes(query) ||
      student.fatherName.toLowerCase().includes(query)
    ).slice(0, 10) // Limit to 10 results for performance
  }, [studentSearch, students])

  const handleStudentSelect = (student: any) => {
    setSelectedStudent(student.id)
    setSelectedStudentData(student)
    setStudentSearch(`${student.studentId} - ${student.name} (s/o ${student.fatherName})`)
    setShowStudentDropdown(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await enrollStudent(selectedStudent, selectedAssignmentId)
      alert("✅ Enrollment Successful!")
      router.push('/admin/enrollment') // Redirect to list
    } catch (err: any) {
      setError(err.message) // Show the "Capacity Exceeded" error here
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">
          ⚠️ {error}
        </div>
      )}

      {/* 1. Student Selection with Search */}
      <div className="relative" ref={dropdownRef}>
        <label className="block text-sm font-medium text-gray-700 mb-1">Search & Select Student</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search by Student ID or Name..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={studentSearch}
            onChange={(e) => {
              setStudentSearch(e.target.value)
              setShowStudentDropdown(true)
              if (!e.target.value) {
                setSelectedStudent('')
                setSelectedStudentData(null)
              }
            }}
            onFocus={() => setShowStudentDropdown(true)}
            required
          />
          {selectedStudent && (
            <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 h-4 w-4" />
          )}
        </div>
        
        {/* Search Results Dropdown */}
        {showStudentDropdown && studentSearch && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student: any) => (
                <div
                  key={student.id}
                  className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  onClick={() => handleStudentSelect(student)}
                >
                  <div className="font-medium text-gray-900">
                    {student.studentId} - {student.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    s/o {student.fatherName}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-2 text-gray-500 text-sm">
                No students found matching "{studentSearch}"
              </div>
            )}
          </div>
        )}
        
        {/* Selected Student Display */}
        {selectedStudentData && (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
            <div className="text-sm font-medium text-green-800">
              ✓ Selected: {selectedStudentData.studentId} - {selectedStudentData.name}
            </div>
            <div className="text-xs text-green-600">
              s/o {selectedStudentData.fatherName}
            </div>
          </div>
        )}
        
        <p className="text-xs text-gray-500 mt-1">
          Don't see the student? <a href="/admin/students/new" className="text-blue-600 underline">Register them first</a>.
        </p>
      </div>

      {/* 2. Course Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Course</label>
        <select 
          required
          className="w-full border p-2 rounded bg-white"
          value={selectedCourseId}
          onChange={(e) => {
            setSelectedCourseId(e.target.value)
            setSelectedAssignmentId('') // Reset slot when course changes
          }}
        >
          <option value="">-- Choose a Course --</option>
          {uniqueCourses.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name} ({c.durationMonths} Months)</option>
          ))}
        </select>
      </div>

      {/* 3. Slot Selection (Dependent Dropdown) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Available Slots</label>
        <select 
          required
          disabled={!selectedCourseId}
          className="w-full border p-2 rounded bg-white disabled:bg-gray-100"
          value={selectedAssignmentId}
          onChange={(e) => setSelectedAssignmentId(e.target.value)}
        >
          <option value="">
            {selectedCourseId ? "-- Choose a Time Slot --" : "Select a Course first"}
          </option>
          {availableSlots.map((a: any) => (
            <option key={a.id} value={a.id}>
              {a.slot.days} • {new Date(a.slot.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })}
              {' '}— {a.slot.room.name} (Cap: {a.slot.room.capacity})
            </option>
          ))}
        </select>
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-black text-white py-2 rounded font-medium hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Confirm Enrollment'}
      </button>
    </form>
  )
}