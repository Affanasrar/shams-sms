// app/teacher/attendance/[id]/attendance-form.tsx
'use client'

import { useActionState } from 'react'
import { submitAttendance } from '@/app/actions/attendance'
import { savePendingAttendance } from '@/lib/offline'
import { CalendarIcon, UserCheck, CheckCircle2, AlertCircle } from 'lucide-react'
import { useState } from 'react'

// Define the shape of our state
type ActionState = {
  success: boolean
  message?: string
  error?: string
}

const initialState: ActionState = { success: false }

type Props = {
  classId: string
  teacherId: string
  enrollments: any[] // We pass the student list here
}

export function AttendanceForm({ classId, teacherId, enrollments }: Props) {
  const [state, action, isPending] = useActionState<ActionState, FormData>(submitAttendance, initialState)
  const [localMessage, setLocalMessage] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  
  const today = new Date().toISOString().split('T')[0]

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      e.preventDefault()
      const form = e.currentTarget
      const fd = new FormData(form)
      const date = fd.get('date') as string
      const entries = Array.from(fd.entries())
        .filter(([k]) => (k as string).startsWith('status_'))
        .map(([k, v]) => ({ studentId: (k as string).replace('status_', ''), status: v as string }))

      const record = { classId, teacherId, date, entries }
      try {
        await savePendingAttendance({ record })
        // show success message locally
        setLocalMessage('Saved locally — will sync when online.')
        setLocalError(null)
      } catch (err) {
        setLocalError('Failed to save offline.')
        setLocalMessage(null)
      }
      return
    }
    // otherwise let the form submit to the server action
  }

  return (
    <form onSubmit={handleSubmit} action={action} className="bg-white rounded-xl shadow-sm border overflow-hidden">
      
      {/* Hidden Fields */}
      <input type="hidden" name="classId" value={classId} />
      <input type="hidden" name="teacherId" value={teacherId} />
      
      {/* Date Header */}
      <div className="p-4 border-b bg-gray-50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
          <CalendarIcon size={16}/> 
          Date:
          <input 
            type="date" 
            name="date" 
            defaultValue={today} 
            className="bg-transparent border-none focus:ring-0 p-0 text-gray-900 font-bold text-sm sm:text-base"
          />
        </div>
        <div className="text-sm text-gray-500 flex items-center gap-3">
          <div>Total Students: {enrollments.length}</div>
          <div className="flex gap-2">
            <button type="button" onClick={() => {
              const inputs = document.querySelectorAll<HTMLInputElement>(`input[name^=\"status_\"]`)
              inputs.forEach(i => { if (i.value === 'PRESENT') i.checked = true })
            }} className="px-3 py-1 bg-green-600 text-white rounded text-xs">All Present</button>
            <button type="button" onClick={() => {
              const inputs = document.querySelectorAll<HTMLInputElement>(`input[name^=\"status_\"]`)
              inputs.forEach(i => { if (i.value === 'ABSENT') i.checked = true })
            }} className="px-3 py-1 bg-red-600 text-white rounded text-xs">All Absent</button>
          </div>
        </div>
      </div>

      {/* Student List */}
      <div className="divide-y max-h-[60vh] overflow-y-auto">
        {enrollments.map((enr) => (
            <div key={enr.student.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-gray-50 transition">
            <div className="flex items-center gap-3 flex-1">
              <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                {enr.student.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-gray-900 truncate">{enr.student.name}</p>
                <p className="text-sm text-blue-600 font-medium">ID: {enr.student.studentId}</p>
                <p className="text-xs text-gray-500">Father: {enr.student.fatherName}</p>
              </div>
            </div>

            {/* Status Radio Buttons */}
              <div className="flex bg-gray-100 p-1 rounded-lg self-end sm:self-center">
                <label className="cursor-pointer">
                  <input type="radio" name={`status_${enr.student.id}`} value="PRESENT" defaultChecked className="peer sr-only" />
                  <span className="block px-5 py-3 rounded-md text-sm font-bold text-gray-500 peer-checked:bg-white peer-checked:text-green-600 peer-checked:shadow-sm transition-all">
                    Present
                  </span>
                </label>
                <label className="cursor-pointer">
                  <input type="radio" name={`status_${enr.student.id}`} value="ABSENT" className="peer sr-only" />
                  <span className="block px-5 py-3 rounded-md text-sm font-bold text-gray-500 peer-checked:bg-white peer-checked:text-red-600 peer-checked:shadow-sm transition-all">
                    Absent
                  </span>
                </label>
                <label className="cursor-pointer">
                  <input type="radio" name={`status_${enr.student.id}`} value="LATE" className="peer sr-only" />
                  <span className="block px-5 py-3 rounded-md text-sm font-bold text-gray-500 peer-checked:bg-white peer-checked:text-amber-600 peer-checked:shadow-sm transition-all">
                    Late
                  </span>
                </label>
              </div>
          </div>
        ))}
      </div>

      {/* Submit Footer */}
      <div className="p-4 bg-gray-50 border-t flex flex-col gap-3">
        
        {/* Success/Error Messages */}
        {state?.message && (
          <div className="flex items-center gap-2 text-sm font-bold text-green-600 bg-green-50 px-3 py-2 rounded-lg border border-green-100">
            <CheckCircle2 size={16} /> {state.message}
          </div>
        )}
        {state?.error && (
          <div className="flex items-center gap-2 text-sm font-bold text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
            <AlertCircle size={16} /> {state.error}
          </div>
        )}
        {localMessage && (
          <div className="flex items-center gap-2 text-sm font-bold text-green-600 bg-green-50 px-3 py-2 rounded-lg border border-green-100">
            <CheckCircle2 size={16} /> {localMessage}
          </div>
        )}
        {localError && (
          <div className="flex items-center gap-2 text-sm font-bold text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
            <AlertCircle size={16} /> {localError}
          </div>
        )}

        <button 
          disabled={isPending}
          className="bg-black text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-800 transition flex items-center justify-center gap-2 disabled:opacity-50 w-full sm:w-auto sm:self-end"
        >
          {isPending ? 'Saving...' : <><UserCheck size={18} /> Save Attendance</>}
        </button>
      </div>

    </form>
  )
}