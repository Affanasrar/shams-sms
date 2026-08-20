'use client'

import { useActionState } from 'react'
import { submitAttendance } from '@/app/actions/attendance'
import { savePendingAttendance } from '@/lib/offline'
import { CalendarIcon, UserCheck, CheckCircle2, AlertCircle, Check, X, Clock } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

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
  
  // Default to PRESENT for everyone
  const [statuses, setStatuses] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {}
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
        setLocalMessage('Saved locally — will sync when online.')
        setLocalError(null)
        try { navigator.vibrate?.(10) } catch {}
      } catch (err) {
        setLocalError('Failed to save offline.')
        setLocalMessage(null)
      }
      return
    }

    setLocalMessage('Saving...')
    try { navigator.vibrate?.(8) } catch {}
  }

  function setStatus(id: string, status: string) {
    setStatuses(prev => ({ ...prev, [id]: status }))
    try { navigator.vibrate?.(4) } catch {}
  }

  function setAll(status: string) {
    const next: Record<string, string> = {}
    for (const k of Object.keys(statuses)) next[k] = status
    setStatuses(next)
    try { navigator.vibrate?.(12) } catch {}
  }

  // Calculate progress
  const presentCount = Object.values(statuses).filter(s => s === 'PRESENT').length
  const totalStudents = enrollments.length

  // Enhanced Swipe support (Right = Present, Left = Absent)
  function attachSwipe(el: HTMLDivElement | null, id: string) {
    if (!el) return
    let startX = 0
    let moved = false
    let currentX = 0

    const onTouchStart = (e: TouchEvent) => { 
      startX = e.touches[0].clientX
      moved = false 
      el.style.transition = 'none'
    }
    
    const onTouchMove = (e: TouchEvent) => {
      currentX = e.touches[0].clientX
      const dx = currentX - startX
      if (Math.abs(dx) > 10) {
        moved = true
        // Visual feedback while swiping (limited max movement)
        const moveX = Math.max(-50, Math.min(50, dx))
        el.style.transform = `translateX(${moveX}px)`
      }
    }
    
    const onTouchEnd = () => {
      el.style.transition = 'transform 0.3s ease'
      el.style.transform = 'translateX(0px)'
      
      if (moved) {
        const dx = currentX - startX
        if (dx > 40) {
          // Swiped Right -> Present
          setStatus(id, 'PRESENT')
          try { navigator.vibrate?.([15]) } catch {}
        } else if (dx < -40) {
          // Swiped Left -> Absent
          setStatus(id, 'ABSENT')
          try { navigator.vibrate?.([15, 30, 15]) } catch {}
        }
      }
    }
    
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: true })
    el.addEventListener('touchend', onTouchEnd)

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }

  return (
    <form onSubmit={handleSubmit} action={action} className="relative flex flex-col min-h-[70vh] bg-muted/30">
      
      {/* Hidden Fields */}
      <input type="hidden" name="classId" value={classId} />
      <input type="hidden" name="teacherId" value={teacherId} />
      
      {/* Sticky Header with Date & Bulk Actions */}
      <div className="sticky top-0 z-10 bg-card border-b shadow-sm rounded-t-2xl">
        <div className="p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <CalendarIcon size={18} className="text-indigo-600 dark:text-indigo-400"/> 
              <input 
                type="date" 
                name="date" 
                defaultValue={today} 
                className="bg-transparent border-none focus:ring-0 p-0 text-foreground font-bold text-base w-32"
              />
            </div>
            <div className="text-xs font-bold px-3 py-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 rounded-full border border-indigo-100 dark:border-indigo-900/50">
              {presentCount} / {totalStudents} Present
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button 
              type="button" 
              onClick={() => setAll('PRESENT')}
              className="flex items-center justify-center gap-2 py-2.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-bold text-sm rounded-xl border border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100 transition active:scale-95"
            >
              <Check size={16} /> Mark All Present
            </button>
            <button 
              type="button" 
              onClick={() => setAll('ABSENT')}
              className="flex items-center justify-center gap-2 py-2.5 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 font-bold text-sm rounded-xl border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 transition active:scale-95"
            >
              <X size={16} /> Mark All Absent
            </button>
          </div>
        </div>
      </div>

      {/* Modern Student Card List */}
      <div className="flex-1 p-3 sm:p-4 space-y-3 pb-24 overflow-y-auto">
        {enrollments.map((enr) => {
          const currentStatus = statuses[enr.student.id]
          
          return (
            <div 
              key={enr.student.id} 
              className={`relative overflow-hidden rounded-[20px] border transition-all duration-300 bg-card shadow-sm ${
                currentStatus === 'PRESENT' ? 'border-emerald-200 dark:border-emerald-900/50' :
                currentStatus === 'ABSENT' ? 'border-rose-200 dark:border-rose-900/50' :
                'border-amber-200 dark:border-amber-900/50'
              }`}
            >
              {/* Subtle background color indicating status */}
              <div className={`absolute inset-0 opacity-[0.03] dark:opacity-10 pointer-events-none transition-colors ${
                currentStatus === 'PRESENT' ? 'bg-emerald-500' :
                currentStatus === 'ABSENT' ? 'bg-rose-500' :
                'bg-amber-500'
              }`} />

              <div 
                ref={(el) => {
                  const cleanup = attachSwipe(el, enr.student.id)
                  if (el) {
                    (el as any)._cleanup = cleanup
                  }
                }}
                className="relative p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 touch-pan-y select-none"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className={`h-12 w-12 rounded-[14px] flex items-center justify-center font-bold text-lg flex-shrink-0 transition-colors ${
                    currentStatus === 'PRESENT' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' :
                    currentStatus === 'ABSENT' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300' :
                    'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                  }`}>
                    {enr.student.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-foreground text-base truncate">{enr.student.name}</p>
                    <p className="text-sm font-medium text-muted-foreground">{enr.student.studentId}</p>
                  </div>
                </div>

                {/* Segmented Controls (One-Tap Fast Marking) */}
                <div className="flex items-center bg-muted/60 p-1 rounded-2xl w-full sm:w-auto">
                  <input type="hidden" name={`status_${enr.student.id}`} value={currentStatus} />
                  
                  <button 
                    type="button" 
                    onClick={() => setStatus(enr.student.id, 'PRESENT')}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                      currentStatus === 'PRESENT' 
                        ? 'bg-emerald-500 text-white shadow-md scale-100' 
                        : 'text-muted-foreground hover:bg-muted scale-95'
                    }`}
                  >
                    <Check size={16} className={currentStatus === 'PRESENT' ? 'opacity-100' : 'opacity-0 hidden sm:block'} />
                    P
                  </button>

                  <button 
                    type="button" 
                    onClick={() => setStatus(enr.student.id, 'LATE')}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                      currentStatus === 'LATE' 
                        ? 'bg-amber-500 text-white shadow-md scale-100' 
                        : 'text-muted-foreground hover:bg-muted scale-95'
                    }`}
                  >
                    <Clock size={16} className={currentStatus === 'LATE' ? 'opacity-100' : 'opacity-0 hidden sm:block'} />
                    L
                  </button>

                  <button 
                    type="button" 
                    onClick={() => setStatus(enr.student.id, 'ABSENT')}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                      currentStatus === 'ABSENT' 
                        ? 'bg-rose-500 text-white shadow-md scale-100' 
                        : 'text-muted-foreground hover:bg-muted scale-95'
                    }`}
                  >
                    <X size={16} className={currentStatus === 'ABSENT' ? 'opacity-100' : 'opacity-0 hidden sm:block'} />
                    A
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Floating Submit Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-card/80 backdrop-blur-xl border-t z-20 safe-padding-bottom">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          
          <div className="flex-1">
            {state?.message && (
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                <CheckCircle2 size={18} /> {state.message}
              </div>
            )}
            {state?.error && (
              <div className="flex items-center gap-2 text-sm font-bold text-rose-700 bg-rose-50 dark:bg-rose-950/40 px-4 py-2.5 rounded-xl border border-rose-100 dark:border-rose-900/50">
                <AlertCircle size={18} /> {state.error}
              </div>
            )}
            {localMessage && (
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                <CheckCircle2 size={18} /> {localMessage}
              </div>
            )}
          </div>

          <button 
            disabled={isPending}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100 active:scale-95 shadow-[0_8px_30px_rgb(79,70,229,0.3)] w-full sm:w-auto"
          >
            {isPending ? (
              'Saving to Cloud...'
            ) : (
              <>
                <UserCheck size={20} /> Submit Attendance
              </>
            )}
          </button>
        </div>
      </div>

    </form>
  )
}