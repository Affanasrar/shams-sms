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
  const [statuses, setStatuses] = useState<Record<string,string>>(() => {
    const map: Record<string,string> = {}
    for (const e of enrollments) map[e.student.id] = 'PRESENT'
    return map
  })
  
  const today = new Date().toISOString().split('T')[0]

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      e.preventDefault()
      const form = e.currentTarget
      const fd = new FormData(form)
      const date = fd.get('date') as string
      const entries = Object.keys(statuses).map(id => ({ studentId: id, status: statuses[id] }))

      const record = { classId, teacherId, date, entries }
      try {
        await savePendingAttendance({ record })
        // show success message locally
        setLocalMessage('Saved locally — will sync when online.')
        setLocalError(null)
        try { navigator.vibrate?.(10) } catch {}
      } catch (err) {
        setLocalError('Failed to save offline.')
        setLocalMessage(null)
      }
      return
    }

    // Optimistic UI: show saved immediately
    setLocalMessage('Saving...')
    try { navigator.vibrate?.(8) } catch {}
    // allow default submit to server action
  }

  function cycleStatus(id: string) {
    setStatuses(prev => {
      const next = { ...prev }
      const order = ['PRESENT','LATE','ABSENT']
      const cur = prev[id] || 'PRESENT'
      const idx = order.indexOf(cur)
      next[id] = order[(idx + 1) % order.length]
      try { navigator.vibrate?.(6) } catch {}
      return next
    })
  }

  function setAll(status: string) {
    const next: Record<string,string> = {}
    for (const k of Object.keys(statuses)) next[k] = status
    setStatuses(next)
    try { navigator.vibrate?.(12) } catch {}
  }

  // swipe support (right swipe = present)
  function attachSwipe(el: HTMLDivElement | null, id: string) {
    if (!el) return
    let startX = 0
    let moved = false
    const onTouchStart = (e: TouchEvent) => { startX = e.touches[0].clientX; moved = false }
    const onTouchMove = (e: TouchEvent) => {
      const dx = e.touches[0].clientX - startX
      if (Math.abs(dx) > 30) moved = true
    }
    const onTouchEnd = () => {
      if (moved) {
        setStatuses(prev => ({ ...prev, [id]: 'PRESENT' }))
        try { navigator.vibrate?.(10) } catch {}
      }
    }
    el.addEventListener('touchstart', onTouchStart)
    el.addEventListener('touchmove', onTouchMove)
    el.addEventListener('touchend', onTouchEnd)

    // cleanup when unmounted
    setTimeout(() => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }, 0)
  }

  return (
    <form onSubmit={handleSubmit} action={action} className="bg-white rounded-xl shadow-sm border overflow-hidden relative">
      
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
        </div>
      </div>

      {/* Student List */}
      <div className="divide-y max-h-[60vh] overflow-y-auto">
        {enrollments.map((enr) => (
            <div key={enr.student.id} ref={(el) => attachSwipe(el, enr.student.id)} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-gray-50 transition">
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

            {/* Large Cycle Toggle */}
            <div className="flex items-center gap-3 self-end sm:self-center">
              <input type="hidden" name={`status_${enr.student.id}`} value={statuses[enr.student.id]} />
              <button type="button" onClick={() => cycleStatus(enr.student.id)} className={`px-4 py-3 rounded-lg font-bold text-sm transition-shadow shadow-sm ${statuses[enr.student.id] === 'PRESENT' ? 'bg-green-600 text-white' : statuses[enr.student.id] === 'ABSENT' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'}`}>
                {statuses[enr.student.id] === 'PRESENT' ? 'Present' : statuses[enr.student.id] === 'ABSENT' ? 'Absent' : 'Late'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Quick Actions */}
      <div className="fixed bottom-16 left-4 right-4 md:right-auto md:left-auto md:bottom-20 z-40 max-w-3xl mx-auto flex justify-center">
        <div className="bg-white p-3 rounded-xl shadow-lg flex gap-3">
          <button type="button" onClick={() => setAll('PRESENT')} className="px-4 py-2 bg-green-600 text-white rounded">All Present</button>
          <button type="button" onClick={() => setAll('ABSENT')} className="px-4 py-2 bg-red-600 text-white rounded">All Absent</button>
          <button type="button" onClick={() => setAll('LATE')} className="px-4 py-2 bg-amber-500 text-white rounded">All Late</button>
        </div>
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