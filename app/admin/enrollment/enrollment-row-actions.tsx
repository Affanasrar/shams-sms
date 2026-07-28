'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Clock, Trash2, X, AlertCircle, CheckCircle2 } from 'lucide-react'
import { dropStudent, changeEnrollmentTiming, restoreEnrollment } from '@/app/actions/enrollment'

type Props = {
  enrollmentId: string
  studentName: string
  courseName: string
  status: string // ACTIVE | DROPPED | COMPLETED etc
  currentCourseOnSlotId: string
  currentTiming: {
    days: string
    startTime: Date
    endTime: Date
    room: string
  }
  availableSlotsForCourse: Array<{
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
}

const initialState: ActionState = { success: false }

export function EnrollmentRowActions({
  enrollmentId,
  studentName,
  courseName,
  currentCourseOnSlotId,
  currentTiming,
  availableSlotsForCourse,
  status
}: Props) {
  const [isTimingModalOpen, setIsTimingModalOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<string>('')
  const [state, setState] = useState<ActionState>(initialState)
  const [isLoading, setIsLoading] = useState(false)
  const [showRefundModal, setShowRefundModal] = useState(false)

  const isDropped = status === 'DROPPED'

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Karachi'
    })
  }

  const handleChangeSlot = async () => {
    if (!selectedSlot) return

    setIsLoading(true)
    try {
      const result = await changeEnrollmentTiming(enrollmentId, selectedSlot)
      setState(result)

      if (result.success) {
        setTimeout(() => {
          setIsTimingModalOpen(false)
          setSelectedSlot('')
          setState(initialState)
          window.location.reload()
        }, 2000)
      }
    } catch (error) {
      setState({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to change timing'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filter available slots to exclude current slot
  const otherAvailableSlots = availableSlotsForCourse.filter(
    slot => slot.id !== currentCourseOnSlotId
  )

  return (
    <>
      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {!isDropped && (
          <>
            <button
              onClick={() => setIsTimingModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-transparent px-3 py-1.5 text-xs font-medium text-blue-600 transition-all hover:border-blue-600 hover:bg-blue-600 hover:text-white dark:text-blue-400 dark:hover:border-blue-500 dark:hover:bg-blue-600 dark:hover:text-white"
              title="Change Course Timing"
            >
              <Clock size={14} /> Change Timing
            </button>
            <Link
              href={`/admin/enrollment/${enrollmentId}/edit`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-transparent px-3 py-1.5 text-xs font-medium text-slate-600 transition-all hover:border-slate-600 hover:bg-slate-700 hover:text-white dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-600 dark:hover:text-white"
              title="Edit Enrollment"
            >
              Edit
            </Link>
          </>
        )}

        {isDropped ? (
          <form
            action={async (formData) => {
              await restoreEnrollment(formData)
            }}
          >
            <input type="hidden" name="enrollmentId" value={enrollmentId} />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg border border-transparent px-3 py-1.5 text-xs font-medium text-emerald-600 transition-all hover:border-emerald-600 hover:bg-emerald-600 hover:text-white dark:text-emerald-400 dark:hover:bg-emerald-600 dark:hover:text-white"
              title="Restore Enrollment"
            >
              <CheckCircle2 size={14} /> Restore
            </button>
          </form>
        ) : (
          <>
            <button
              onClick={() => {
                if (confirm("Are you sure you want to drop this student? This action cannot be undone.")) {
                  setShowRefundModal(true)
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-transparent px-3 py-1.5 text-xs font-medium text-rose-600 transition-all hover:border-rose-600 hover:bg-rose-600 hover:text-white dark:text-rose-400 dark:hover:bg-rose-600 dark:hover:text-white"
              title="Drop Student from Class"
            >
              <Trash2 size={14} /> Drop
            </button>

            {/* Drop / Refund Modal */}
            {showRefundModal && (
              <form
                action={async (formData) => {
                  await dropStudent(formData)
                  setShowRefundModal(false)
                }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
              >
                <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white dark:bg-slate-900 shadow-2xl ring-1 ring-black/10 dark:ring-white/10">
                  {/* Header */}
                  <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950 px-6 py-5 text-white">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-500/20">
                        <AlertCircle className="h-5 w-5 text-rose-300" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-white/60">Enrollment Action</p>
                        <h3 className="mt-0.5 text-lg font-semibold">Drop Student</h3>
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="px-6 py-5 space-y-4">
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      <span className="font-semibold text-slate-900 dark:text-white">{studentName}</span> has unpaid or partial fees for this month. What should happen to those fees?
                    </p>

                    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-4 space-y-2.5">
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">Refund:</span> Delete current month fees so the student can re-enroll fresh.
                        </p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">No Refund:</span> Keep fees on record — the balance remains owed after dropping.
                        </p>
                      </div>
                    </div>

                    <input type="hidden" name="enrollmentId" value={enrollmentId} />

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="submit"
                        name="refund"
                        value="true"
                        className="flex-1 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                      >
                        Refund Fees
                      </button>
                      <button
                        type="submit"
                        name="refund"
                        value="false"
                        className="flex-1 rounded-2xl bg-slate-700 dark:bg-slate-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:hover:bg-slate-500"
                      >
                        Keep Fees
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowRefundModal(false)}
                        className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </>
        )}
      </div>

      {/* Change Timing Modal */}
      {isTimingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white dark:bg-slate-900 shadow-2xl ring-1 ring-black/10 dark:ring-white/10">
            {/* Header */}
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-6 py-5 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-white/60">Enrollment Action</p>
                  <h2 className="mt-1 text-xl font-semibold">Change Course Timing</h2>
                  <p className="mt-1 text-sm text-white/70">
                    <span className="font-medium text-white">{studentName}</span> · {courseName}
                  </p>
                </div>
                <button
                  onClick={() => { setIsTimingModalOpen(false); setSelectedSlot(''); setState(initialState) }}
                  className="rounded-full border border-white/15 p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-5">
              {/* Current Timing */}
              <div className="rounded-2xl border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-950/40 p-4">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">Current Timing</h3>
                <div className="space-y-1 text-sm text-blue-800 dark:text-blue-300">
                  <p>📅 Days: <span className="font-medium">{currentTiming.days}</span></p>
                  <p>⏰ Time: <span className="font-medium">{formatTime(currentTiming.startTime)} – {formatTime(currentTiming.endTime)}</span></p>
                  <p>📍 Room: <span className="font-medium">{currentTiming.room}</span></p>
                </div>
              </div>

              {/* Available Timings */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Select New Timing</h3>

                {otherAvailableSlots.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {otherAvailableSlots.map((slot) => {
                      const availableSeats = slot.room.capacity - slot.enrollmentCount
                      const isFull = availableSeats <= 0

                      return (
                        <label
                          key={slot.id}
                          className={`flex items-start gap-3 rounded-2xl border p-4 cursor-pointer transition ${
                            selectedSlot === slot.id
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 dark:border-indigo-500'
                              : isFull
                              ? 'border-rose-200 dark:border-rose-800/40 bg-rose-50 dark:bg-rose-950/30 opacity-50 cursor-not-allowed'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/40'
                          }`}
                        >
                          <input
                            type="radio"
                            name="courseOnSlotId"
                            value={slot.id}
                            checked={selectedSlot === slot.id}
                            onChange={(e) => setSelectedSlot(e.target.value)}
                            disabled={isFull}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-slate-900 dark:text-white">{slot.days}</div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                              ⏰ {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">📍 {slot.room.name}</div>
                            <div className={`mt-1 text-xs font-medium ${isFull ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                              {isFull ? '❌ Full' : `✅ ${availableSeats} seats available`}
                            </div>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/30 p-4 flex gap-3">
                    <AlertCircle className="shrink-0 text-amber-600 dark:text-amber-400" size={20} />
                    <div>
                      <p className="font-semibold text-amber-900 dark:text-amber-200">No other timings available</p>
                      <p className="text-sm text-amber-800 dark:text-amber-300">There are no alternative timings available for this course.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Feedback */}
              {state.success && (
                <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/30 p-4 flex gap-3">
                  <CheckCircle2 className="shrink-0 text-emerald-600 dark:text-emerald-400" size={20} />
                  <div>
                    <p className="font-semibold text-emerald-900 dark:text-emerald-200">Success!</p>
                    <p className="text-sm text-emerald-800 dark:text-emerald-300">{state.message}</p>
                  </div>
                </div>
              )}
              {state.error && (
                <div className="rounded-2xl border border-rose-200 dark:border-rose-800/40 bg-rose-50 dark:bg-rose-950/30 p-4 flex gap-3">
                  <AlertCircle className="shrink-0 text-rose-600 dark:text-rose-400" size={20} />
                  <div>
                    <p className="font-semibold text-rose-900 dark:text-rose-200">Error</p>
                    <p className="text-sm text-rose-800 dark:text-rose-300">{state.error}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 dark:border-slate-800 px-6 py-4 flex gap-3 bg-slate-50 dark:bg-slate-950">
              <button
                onClick={handleChangeSlot}
                disabled={!selectedSlot || isLoading || state.success || otherAvailableSlots.length === 0}
                className="flex-1 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
              >
                {isLoading ? 'Updating…' : state.success ? 'Timing Changed!' : 'Confirm Change'}
              </button>
              <button
                onClick={() => { setIsTimingModalOpen(false); setSelectedSlot(''); setState(initialState) }}
                disabled={isLoading}
                className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
