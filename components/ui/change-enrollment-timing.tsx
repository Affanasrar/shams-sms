'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { Clock, AlertCircle, CheckCircle2 } from 'lucide-react'
import { changeEnrollmentTiming } from '@/app/actions/enrollment'

type Props = {
 enrollmentId: string
 currentCourseOnSlotId: string
 currentTiming: {
 days: string
 startTime: Date
 endTime: Date
 room: string
 }
 studentName: string
 courseName: string
 availableSlots: Array<{
 id: string
 days: string
 startTime: Date
 endTime: Date
 room: { name: string; capacity: number }
 enrollmentCount: number
 }>
}

type ActionState = {
 success: boolean
 message?: string
 error?: string
 enrollment?: any
}

const initialState: ActionState = { success: false }

export function ChangeEnrollmentTiming({
 enrollmentId,
 currentCourseOnSlotId,
 currentTiming,
 studentName,
 courseName,
 availableSlots
}: Props) {
 const [isOpen, setIsOpen] = useState(false)
 const [selectedSlot, setSelectedSlot] = useState<string>('')

 const actionWithEnrollment = async (prevState: ActionState, formData: FormData) => {
 const newCourseOnSlotId = formData.get('courseOnSlotId') as string
 return await changeEnrollmentTiming(enrollmentId, newCourseOnSlotId)
 }

 const [state, formAction, pending] = useActionState<ActionState, FormData>(
 actionWithEnrollment,
 initialState
 )

 // Filter available slots to exclude current slot
 const otherAvailableSlots = availableSlots.filter(
 slot => slot.id !== currentCourseOnSlotId
 )

 const formatTime = (date: Date) => {
 return new Date(date).toLocaleTimeString('en-US', {
 hour: 'numeric',
 minute: '2-digit',
 hour12: true,
 timeZone: 'Asia/Karachi'
 })
 }

 return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition flex items-center gap-1.5 text-xs font-semibold shadow-xs"
      >
        <Clock size={14} />
        Change Timing
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-[28px] border border-border max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl space-y-5">
            <div className="border-b border-border pb-4">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-3 py-0.5 text-xs font-bold uppercase tracking-wider mb-2">
                <Clock size={12} />
                Student Slot Transfer
              </div>
              <h2 className="text-xl font-bold text-foreground">Change Course Timing Slot</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Move <span className="font-semibold text-foreground">{studentName}</span> to an alternative slot in <span className="font-semibold text-foreground">{courseName}</span>.
              </p>
            </div>

            {/* Current Timing */}
            <div className="bg-muted/50 border border-border rounded-2xl p-4 space-y-1 text-xs">
              <h3 className="font-bold text-foreground text-sm mb-1.5">Current Timing Assignment</h3>
              <p className="text-muted-foreground">📅 Days: <span className="font-semibold text-foreground">{currentTiming.days}</span></p>
              <p className="text-muted-foreground">⏰ Time: <span className="font-semibold text-foreground">{formatTime(currentTiming.startTime)} - {formatTime(currentTiming.endTime)}</span></p>
              <p className="text-muted-foreground">📍 Room: <span className="font-semibold text-foreground">{currentTiming.room}</span></p>
            </div>

            {/* Available Timings */}
            <div>
              <h3 className="font-bold text-foreground text-sm mb-3">Select Target Slot</h3>

              {otherAvailableSlots.length > 0 ? (
                <form action={formAction} className="space-y-4">
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {otherAvailableSlots.map((slot) => {
                      const availableSeats = Math.max(0, slot.room.capacity - slot.enrollmentCount)
                      const isFull = availableSeats <= 0

                      return (
                        <label
                          key={slot.id}
                          className={`flex items-start gap-3 p-3.5 border-2 rounded-2xl cursor-pointer transition ${
                            selectedSlot === slot.id
                              ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/30'
                              : isFull
                              ? 'border-rose-200 dark:border-rose-900/40 bg-rose-50/30 dark:bg-rose-950/10 opacity-60 cursor-not-allowed'
                              : 'border-border bg-card hover:border-indigo-200 dark:hover:border-indigo-800'
                          }`}
                        >
                          <input
                            type="radio"
                            name="courseOnSlotId"
                            value={slot.id}
                            checked={selectedSlot === slot.id}
                            onChange={(e) => setSelectedSlot(e.target.value)}
                            disabled={isFull}
                            className="mt-1 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-foreground text-sm">{slot.days}</span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                  isFull
                                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                }`}
                              >
                                {isFull ? 'FULL' : `${availableSeats} Seats Open`}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              ⏰ {formatTime(slot.startTime)} - {formatTime(slot.endTime)} • 📍 {slot.room.name}
                            </div>
                          </div>
                        </label>
                      )
                    })}
                  </div>

                  {/* Messages */}
                  {state.success && (
                    <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl flex gap-3 text-xs">
                      <CheckCircle2 className="text-emerald-600 dark:emerald-300 shrink-0" size={18} />
                      <div>
                        <h4 className="font-bold text-emerald-900 dark:text-emerald-200">Success</h4>
                        <p className="text-emerald-800 dark:text-emerald-300">{state.message || 'Timing changed successfully!'}</p>
                      </div>
                    </div>
                  )}

                  {state.error && (
                    <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex gap-3 text-xs">
                      <AlertCircle className="text-rose-600 dark:text-rose-300 shrink-0" size={18} />
                      <div>
                        <h4 className="font-bold text-rose-900 dark:text-rose-200">Transfer Error</h4>
                        <p className="text-rose-800 dark:text-rose-300">{state.error}</p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-3 border-t border-border">
                    <button
                      type="submit"
                      disabled={!selectedSlot || pending || state.success}
                      className="flex-1 bg-indigo-600 text-white py-2.5 px-4 rounded-2xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold text-xs shadow-xs"
                    >
                      {pending ? 'Updating...' : state.success ? 'Slot Updated!' : 'Confirm Slot Transfer'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false)
                        setSelectedSlot('')
                      }}
                      disabled={pending}
                      className="rounded-2xl border border-border px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-2xl flex gap-3 text-xs">
                  <AlertCircle className="text-amber-600 dark:text-amber-300 shrink-0" size={18} />
                  <div>
                    <p className="font-bold text-amber-900 dark:text-amber-200">No other timings available</p>
                    <p className="text-amber-800 dark:text-amber-300">There are currently no other slots created for this course.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
 )
}
