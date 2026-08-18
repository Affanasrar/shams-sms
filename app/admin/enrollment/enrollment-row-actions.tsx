'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
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
 const [mounted, setMounted] = useState(false)

 useEffect(() => {
 setMounted(true)
 }, [])

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
 className="inline-flex items-center gap-1.5 rounded-lg border border-transparent px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-300 transition-all hover:border-blue-600 hover:bg-blue-600 hover:text-white dark:text-blue-400 dark:hover:border-blue-500 dark:hover:bg-blue-600 "
 title="Change Course Timing"
 >
 <Clock size={14} /> Change Timing
 </button>
 <Link
 href={`/admin/enrollment/${enrollmentId}/edit`}
 className="inline-flex items-center gap-1.5 rounded-lg border border-transparent px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-slate-600 hover:bg-slate-700 hover:text-white "
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
 className="inline-flex items-center gap-1.5 rounded-lg border border-transparent px-3 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-300 transition-all hover:border-emerald-600 hover:bg-emerald-600 hover:text-white dark:text-emerald-400 dark:hover:bg-emerald-600 "
 title="Restore Enrollment"
 >
 <CheckCircle2 size={14} /> Restore
 </button>
 </form>
 ) : (
 <button
 onClick={() => setShowRefundModal(true)}
 className="inline-flex items-center gap-1.5 rounded-lg border border-transparent px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-300 transition-all hover:border-rose-600 hover:bg-rose-600 hover:text-white dark:text-rose-400 dark:hover:bg-rose-600 "
 title="Drop Student from Class"
 >
 <Trash2 size={14} /> Drop
 </button>
 )}
 </div>

 {/* Drop / Refund Modal rendered via createPortal directly in document.body */}
 {mounted && showRefundModal && createPortal(
 <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
 <div className="w-full max-w-md overflow-hidden rounded-3xl bg-card shadow-2xl ring-1 ring-slate-900/10 dark:ring-white/10">
 {/* Header */}
 <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950 px-6 py-5 text-white">
 <div className="flex items-center gap-3">
 <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/400/20">
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
 <p className="text-sm text-foreground ">
 Are you sure you want to drop <span className="font-semibold text-foreground ">{studentName}</span> from <span className="font-semibold text-foreground ">{courseName}</span>?
 </p>

 <div className="rounded-2xl border border-border bg-muted p-4 space-y-2.5">
 <div className="flex items-start gap-2.5">
 <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-emerald-50 dark:bg-emerald-950/400" />
 <p className="text-xs text-muted-foreground ">
 <span className="font-semibold text-foreground ">Refund Fees:</span> Delete unpaid current month fees so the student leaves with zero debt.
 </p>
 </div>
 <div className="flex items-start gap-2.5">
 <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-amber-50 dark:bg-amber-950/400" />
 <p className="text-xs text-muted-foreground ">
 <span className="font-semibold text-foreground ">Keep Fees:</span> Keep unpaid fees on record — student balance remains owed.
 </p>
 </div>
 </div>

 <div className="flex flex-col gap-2 sm:flex-row">
 <button
 type="button"
 disabled={isLoading}
 onClick={async () => {
 setIsLoading(true)
 try {
 const formData = new FormData()
 formData.append('enrollmentId', enrollmentId)
 formData.append('refund', 'true')
 await dropStudent(formData)
 setShowRefundModal(false)
 } catch (err) {
 console.error(err)
 } finally {
 setIsLoading(false)
 }
 }}
 className="flex-1 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
 >
 {isLoading ? 'Processing…' : 'Refund Fees & Drop'}
 </button>
 <button
 type="button"
 disabled={isLoading}
 onClick={async () => {
 setIsLoading(true)
 try {
 const formData = new FormData()
 formData.append('enrollmentId', enrollmentId)
 formData.append('refund', 'false')
 await dropStudent(formData)
 setShowRefundModal(false)
 } catch (err) {
 console.error(err)
 } finally {
 setIsLoading(false)
 }
 }}
 className="flex-1 rounded-2xl bg-amber-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50"
 >
 {isLoading ? 'Processing…' : 'Keep Fees & Drop'}
 </button>
 <button
 type="button"
 disabled={isLoading}
 onClick={() => setShowRefundModal(false)}
 className="rounded-2xl border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground transition hover:bg-muted "
 >
 Cancel
 </button>
 </div>
 </div>
 </div>
 </div>,
 document.body
 )}

 {/* Change Timing Modal rendered via createPortal directly in document.body */}
 {mounted && isTimingModalOpen && createPortal(
 <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
 <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-card shadow-2xl ring-1 ring-slate-900/10 dark:ring-white/10">
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
 className="rounded-full border border-white/15 p-2 text-white/70 transition hover:bg-card/10 hover:text-white"
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
 <h3 className="text-sm font-semibold text-foreground mb-3">Select New Timing</h3>

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
 : 'border-border hover:border-border bg-card '
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
 <div className="font-semibold text-foreground ">{slot.days}</div>
 <div className="text-sm text-muted-foreground ">
 ⏰ {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
 </div>
 <div className="text-sm text-muted-foreground ">📍 {slot.room.name}</div>
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
 <div className="border-t border-border px-6 py-4 flex gap-3 bg-muted ">
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
 className="flex-1 rounded-2xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted "
 >
 Cancel
 </button>
 </div>
 </div>
 </div>,
 document.body
 )}
 </>
 )
}
