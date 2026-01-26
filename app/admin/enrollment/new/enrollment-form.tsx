// app/admin/enrollment/new/enrollment-form.tsx
'use client'

import { useState } from 'react'
import { enrollStudent } from '@/app/actions/enrollment' // The Logic from Module 3
import { useRouter } from 'next/navigation'

export function EnrollmentForm({ students, assignments }: any) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form State
  const [selectedStudent, setSelectedStudent] = useState('')
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('')

  // 1. Filter Logic: Extract unique courses from assignments
  // We only want to show courses that actually have a slot assigned
  const uniqueCourses = Array.from(new Set(assignments.map((a: any) => JSON.stringify(a.course))))
    .map((s: any) => JSON.parse(s))

  // 2. Filter Logic: When a course is selected, show available time slots
  const availableSlots = assignments.filter((a: any) => a.courseId === selectedCourseId)

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

      {/* 1. Student Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Student</label>
        <select 
          required
          className="w-full border p-2 rounded bg-white"
          value={selectedStudent}
          onChange={(e) => setSelectedStudent(e.target.value)}
        >
          <option value="">-- Choose a Student --</option>
          {students.map((s: any) => (
            <option key={s.id} value={s.id}>
              {s.studentId} - {s.name} (s/o {s.fatherName})
            </option>
          ))}
        </select>
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