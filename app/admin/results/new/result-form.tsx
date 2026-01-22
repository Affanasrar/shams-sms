// app/admin/results/new/result-form.tsx
'use client'

import { useState, useActionState } from 'react' // 👈 CHANGED: Import from 'react'
import { getStudentCourses, saveResult } from '@/app/actions/results'

// Initial state for the server action
const initialState = { success: false, error: '' }

export function ResultForm({ students }: { students: any[] }) {
  // 👈 CHANGED: useActionState instead of useFormState
  // It returns [state, action, isPending]
  const [state, formAction, isPending] = useActionState(saveResult, initialState)
  
  // Local state for dynamic dropdowns
  const [selectedStudent, setSelectedStudent] = useState('')
  const [courses, setCourses] = useState<any[]>([])
  const [loadingCourses, setLoadingCourses] = useState(false)

  // When student changes, fetch their courses
  const handleStudentChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const studentId = e.target.value
    setSelectedStudent(studentId)
    setCourses([]) // Clear old
    
    if (studentId) {
      setLoadingCourses(true)
      const data = await getStudentCourses(studentId)
      setCourses(data)
      setLoadingCourses(false)
    }
  }

  return (
    <form action={formAction} className="space-y-6">
      
      {/* 1. Student Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Student</label>
        <select 
          name="studentId" 
          required
          className="w-full border p-2 rounded bg-white"
          onChange={handleStudentChange}
          value={selectedStudent}
        >
          <option value="">-- Choose Student --</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.name} (s/o {s.fatherName})</option>
          ))}
        </select>
      </div>

      {/* 2. Course Selection (Dynamic) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Course</label>
        <select 
          name="courseId" 
          required
          disabled={!selectedStudent || courses.length === 0}
          className="w-full border p-2 rounded bg-white disabled:bg-gray-100"
        >
          <option value="">
            {loadingCourses ? "Loading courses..." : "-- Choose Course --"}
          </option>
          {courses.map((c) => (
            <option key={c.courseId} value={c.courseId}>
              {c.courseName} ({c.status})
            </option>
          ))}
        </select>
        {selectedStudent && courses.length === 0 && !loadingCourses && (
          <p className="text-xs text-red-500 mt-1">This student has no enrollments yet.</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* 3. Marks Obtained */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Marks Obtained</label>
          <input 
            type="number" name="marks" step="0.5" required
            className="w-full border p-2 rounded"
            placeholder="e.g. 85"
          />
        </div>

        {/* 4. Total Marks */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks</label>
          <input 
            type="number" name="total" required defaultValue={100}
            className="w-full border p-2 rounded"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* 5. Grade */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
          <select name="grade" className="w-full border p-2 rounded bg-white">
            <option>A+</option>
            <option>A</option>
            <option>B</option>
            <option>C</option>
            <option>F</option>
          </select>
        </div>

        {/* 6. Attempt Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Attempt #</label>
          <input 
            type="number" name="attempt" defaultValue={1} min={1}
            className="w-full border p-2 rounded"
          />
        </div>
      </div>

      {/* Error Message Display */}
      {state?.error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">
           ⚠️ {state.error}
        </div>
      )}

      <button 
        type="submit" 
        disabled={isPending} // 👈 Disable while submitting
        className="w-full bg-black text-white py-3 rounded font-medium hover:bg-gray-800 transition disabled:opacity-50"
      >
        {isPending ? 'Saving...' : 'Save Result'}
      </button>
    </form>
  )
}