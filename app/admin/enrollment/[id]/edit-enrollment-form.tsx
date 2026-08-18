'use client'

import { useMemo, useState } from 'react'
import { useActionState } from 'react'
import { updateEnrollment } from '@/app/actions/enrollment'
import { format } from 'date-fns'
import {
 Check,
 AlertCircle,
 Clock,
 MapPin,
 BookOpen,
 ArrowRight,
 Loader2,
 Calendar,
 CheckCircle2,
} from 'lucide-react'

interface AssignmentOption {
 id: string
 courseId: string
 courseName: string
 slotLabel: string
 slotStartTime: string
 slotEndTime: string
 roomName: string
 roomCapacity: number
}

interface EnrollmentEditData {
 id: string
 studentId: string
 studentName: string
 currentCourseOnSlotId: string
 currentCourseName: string
 currentSlotLabel: string
 currentSlotTime: Date
 currentSlotRoom: string
 joiningDate: string
}

interface Props {
 enrollment: EnrollmentEditData
 assignments: AssignmentOption[]
}

type ActionState =
 | { success: true; message: string; error?: undefined }
 | { success: false; error: string; message?: undefined }

const initialState: ActionState = { success: false, error: '' }

export function EditEnrollmentForm({ enrollment, assignments }: Props) {
 const [joiningDate, setJoiningDate] = useState(enrollment.joiningDate)
 const [selectedCourseId, setSelectedCourseId] = useState(
 assignments.find((a) => a.id === enrollment.currentCourseOnSlotId)?.courseId || ''
 )
 const [selectedAssignmentId, setSelectedAssignmentId] = useState(enrollment.currentCourseOnSlotId)

 const [state, formAction, isPending] = useActionState(updateEnrollment, initialState)

 // Unique courses from assignments
 const uniqueCourses = useMemo(() => {
 const map = new Map<string, { courseId: string; courseName: string }>()
 for (const a of assignments) {
 if (!map.has(a.courseId)) map.set(a.courseId, { courseId: a.courseId, courseName: a.courseName })
 }
 return Array.from(map.values())
 }, [assignments])

 // Slots for selected course
 const slotsForCourse = useMemo(
 () => assignments.filter((a) => a.courseId === selectedCourseId),
 [assignments, selectedCourseId]
 )

 const selectedSlot = assignments.find((a) => a.id === selectedAssignmentId)
 const selectedCourse = uniqueCourses.find((c) => c.courseId === selectedCourseId)

 const dueDay = joiningDate ? new Date(joiningDate).getDate() : null

 const isStep2Active = !!joiningDate
 const isStep3Active = isStep2Active && !!selectedCourseId
 const isFormValid = !!joiningDate && !!selectedCourseId && !!selectedAssignmentId

 const stepBadge = (n: number, done: boolean, active: boolean) =>
 done
 ? 'bg-emerald-100 text-emerald-700 dark:text-emerald-300'
 : active
 ? 'bg-indigo-100 text-indigo-700 dark:text-indigo-300'
 : 'bg-muted text-muted-foreground'

 return (
 <form action={formAction} className="space-y-5">
 <input type="hidden" name="enrollmentId" value={enrollment.id} />

 {/* ── Error / Success banners ── */}
 {!state.success && state.error && (
 <div className="flex gap-3 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-4">
 <AlertCircle className="mt-0.5 size-5 shrink-0 text-red-600 dark:text-red-300" />
 <div>
 <p className="font-semibold text-red-900">Update Failed</p>
 <p className="mt-0.5 text-sm text-red-700 dark:text-red-300">{state.error}</p>
 </div>
 </div>
 )}
 {state.success && (
 <div className="flex gap-3 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 p-4">
 <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-300" />
 <div>
 <p className="font-semibold text-emerald-900">Enrollment Updated</p>
 <p className="mt-0.5 text-sm text-emerald-700 dark:text-emerald-300">{state.message}</p>
 </div>
 </div>
 )}

 {/* ══ Step 1: Student Info & Enrollment Date ══ */}
 <div className="rounded-[24px] border border-border/80 bg-card/90 p-6 shadow-[0_18px_50px_-24px_rgba(15,23,42,0.28)] dark:shadow-[0_18px_50px_-24px_rgba(0,0,0,0.5)]">
 <div className="mb-5 flex items-start gap-3">
 <div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${stepBadge(1, !!joiningDate, true)}`}>
 {joiningDate ? <Check className="size-4" /> : '1'}
 </div>
 <div>
 <h3 className="text-base font-semibold text-foreground ">Student & Enrollment Date</h3>
 <p className="mt-0.5 text-sm text-muted-foreground ">Review the student and set the correct enrollment date</p>
 </div>
 </div>

 {/* Student display */}
 <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border bg-muted p-4 ">
 <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-sm font-bold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
 {enrollment.studentName.charAt(0).toUpperCase()}
 </div>
 <div>
 <p className="font-semibold text-foreground ">{enrollment.studentName}</p>
 <p className="text-xs text-muted-foreground ">ID: {enrollment.id.slice(0, 16)}…</p>
 </div>
 <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
 <span className="size-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/400" />
 Active
 </span>
 </div>

 {/* Date input */}
 <div>
 <label htmlFor="joiningDate" className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground ">
 <Calendar className="size-4" />
 Enrollment Date
 </label>
 <input
 id="joiningDate"
 type="date"
 name="joiningDate"
 value={joiningDate}
 onChange={(e) => setJoiningDate(e.target.value)}
 required
 className="w-full rounded-2xl border border-border bg-card/90 px-4 py-3 text-sm text-foreground shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
 />
 {dueDay && (
 <p className="mt-2 text-xs text-muted-foreground ">
 Monthly fee will be due on the <strong className="text-foreground ">{dueDay}{ordinal(dueDay)}</strong> of each month
 </p>
 )}
 </div>
 </div>

 {/* ══ Step 2: Select Course ══ */}
 <div className={`rounded-[24px] border border-border/80 p-6 transition-all ${isStep2Active ? 'bg-card/90 shadow-[0_18px_50px_-24px_rgba(15,23,42,0.28)] dark:shadow-[0_18px_50px_-24px_rgba(0,0,0,0.5)]' : 'bg-muted/80 opacity-60 '}`}>
 <div className="mb-5 flex items-start gap-3">
 <div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${stepBadge(2, !!selectedCourseId, isStep2Active)}`}>
 {selectedCourseId ? <Check className="size-4" /> : '2'}
 </div>
 <div>
 <h3 className="text-base font-semibold text-foreground ">Select Course</h3>
 <p className="mt-0.5 text-sm text-muted-foreground ">Choose the course to enroll the student in</p>
 </div>
 </div>

 <div className="space-y-2">
 {uniqueCourses.map((course) => {
 const isActive = selectedCourseId === course.courseId
 return (
 <button
 key={course.courseId}
 type="button"
 disabled={!isStep2Active}
 onClick={() => {
 setSelectedCourseId(course.courseId)
 const firstSlot = assignments.find((a) => a.courseId === course.courseId)
 if (firstSlot) setSelectedAssignmentId(firstSlot.id)
 }}
 className={[
 'flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left transition-all',
 isActive
 ? 'border-indigo-500 bg-indigo-50/70 dark:border-indigo-500 dark:bg-indigo-50 dark:bg-indigo-950/400/10'
 : 'border-border bg-card hover:border-border hover:bg-muted ',
 ].join(' ')}
 >
 <div className={[
 'flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold',
 isActive ? 'bg-indigo-50 dark:bg-indigo-950/400 text-white' : 'bg-muted text-muted-foreground ',
 ].join(' ')}>
 {course.courseName.charAt(0).toUpperCase()}
 </div>
 <div className="flex-1">
 <p className={`font-semibold ${isActive ? 'text-indigo-900 dark:text-indigo-200' : 'text-foreground '}`}>
 {course.courseName}
 </p>
 {enrollment.currentCourseName === course.courseName && (
 <p className="text-xs text-muted-foreground ">Currently enrolled</p>
 )}
 </div>
 {isActive && <Check className="size-5 shrink-0 text-indigo-500" />}
 </button>
 )
 })}
 </div>

 {selectedCourseId && (
 <div className="mt-3 flex items-center gap-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 px-3 py-2 dark:bg-indigo-50 dark:bg-indigo-950/400/10">
 <BookOpen className="size-4 text-indigo-600 dark:text-indigo-400" />
 <span className="text-sm text-indigo-700 dark:text-indigo-300">
 {selectedCourse?.courseName} selected
 </span>
 </div>
 )}
 </div>

 {/* ══ Step 3: Choose Time Slot ══ */}
 <div className={`rounded-[24px] border border-border/80 p-6 transition-all ${isStep3Active ? 'bg-card/90 shadow-[0_18px_50px_-24px_rgba(15,23,42,0.28)] dark:shadow-[0_18px_50px_-24px_rgba(0,0,0,0.5)]' : 'bg-muted/80 opacity-60 '}`}>
 <div className="mb-5 flex items-start gap-3">
 <div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${stepBadge(3, !!selectedAssignmentId, isStep3Active)}`}>
 {selectedAssignmentId ? <Check className="size-4" /> : '3'}
 </div>
 <div>
 <h3 className="text-base font-semibold text-foreground ">Choose Time Slot</h3>
 <p className="mt-0.5 text-sm text-muted-foreground ">Pick an available class schedule</p>
 </div>
 </div>

 {!isStep3Active ? (
 <p className="py-4 text-sm text-muted-foreground ">Select a course above to see available slots</p>
 ) : slotsForCourse.length === 0 ? (
 <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/40 p-4 dark:border-amber-800 dark:bg-amber-900/20">
 <p className="text-sm text-amber-800 dark:text-amber-300">No slots available for this course</p>
 </div>
 ) : (
 <div className="space-y-3">
 {slotsForCourse.map((slot) => {
 const isSelected = selectedAssignmentId === slot.id
 const isCurrent = enrollment.currentCourseOnSlotId === slot.id

 return (
 <label
 key={slot.id}
 className={[
 'flex cursor-pointer gap-4 rounded-[20px] border-2 p-4 transition-all',
 isSelected
 ? 'border-indigo-500 bg-indigo-50/70 dark:border-indigo-500 dark:bg-indigo-50 dark:bg-indigo-950/400/10'
 : 'border-border bg-card hover:border-border hover:bg-muted ',
 ].join(' ')}
 >
 <input
 type="radio"
 name="courseOnSlotId"
 value={slot.id}
 checked={isSelected}
 onChange={() => setSelectedAssignmentId(slot.id)}
 className="mt-1 cursor-pointer accent-indigo-600"
 />
 <div className="flex-1 min-w-0">
 <div className="flex flex-wrap items-center gap-2 mb-1.5">
 <Clock className={`size-4 shrink-0 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted-foreground '}`} />
 <span className={`font-semibold ${isSelected ? 'text-indigo-900 dark:text-indigo-200' : 'text-foreground '}`}>
 {slot.slotLabel}
 </span>
 <span className={`text-sm ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-muted-foreground '}`}>
 {format(new Date(slot.slotStartTime), 'hh:mm a')} – {format(new Date(slot.slotEndTime), 'hh:mm a')}
 </span>
 {isCurrent && (
 <span className="rounded-full border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
 Current
 </span>
 )}
 </div>
 <div className="flex items-center gap-1.5 text-sm text-muted-foreground ">
 <MapPin className="size-3.5" />
 {slot.roomName}
 <span className="mx-1 text-slate-300 ">·</span>
 <span>{slot.roomCapacity} seats</span>
 </div>
 </div>
 </label>
 )
 })}
 </div>
 )}
 </div>

 {/* ══ Step 4: Summary & Confirm ══ */}
 {isFormValid && selectedSlot && (
 <div className="rounded-[24px] border border-indigo-200 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50 to-slate-50 p-6 shadow-sm dark:border-indigo-800 dark:from-indigo-900/20 dark:to-slate-800/50">
 <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground ">
 <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
 Review & Confirm
 </h3>

 <div className="space-y-2">
 <SummaryRow label="Student" value={enrollment.studentName} />
 <SummaryRow label="Course" value={selectedCourse?.courseName ?? '—'} />
 <SummaryRow label="Days" value={selectedSlot.slotLabel} />
 <SummaryRow
 label="Time"
 value={`${format(new Date(selectedSlot.slotStartTime), 'hh:mm a')} – ${format(new Date(selectedSlot.slotEndTime), 'hh:mm a')}`}
 />
 <SummaryRow label="Room" value={selectedSlot.roomName} />
 {dueDay && (
 <SummaryRow label="Fee Due" value={`${dueDay}${ordinal(dueDay)} of each month`} />
 )}
 </div>
 </div>
 )}

 {/* ══ Submit Button ══ */}
 <button
 type="submit"
 disabled={!isFormValid || isPending}
 className={[
 'flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 font-semibold text-white transition-all',
 isFormValid && !isPending
 ? 'cursor-pointer bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-50 dark:bg-indigo-950/400'
 : 'cursor-not-allowed bg-slate-300 ',
 ].join(' ')}
 >
 {isPending ? (
 <>
 <Loader2 className="size-5 animate-spin" />
 Saving Changes…
 </>
 ) : (
 <>
 Save Enrollment
 <ArrowRight className="size-5" />
 </>
 )}
 </button>
 </form>
 )
}

/* ── Helper components ── */

function SummaryRow({ label, value }: { label: string; value: string }) {
 return (
 <div className="flex items-center justify-between rounded-xl bg-card px-4 py-3 ">
 <span className="text-sm font-medium text-muted-foreground ">{label}</span>
 <span className="text-sm font-semibold text-foreground ">{value}</span>
 </div>
 )
}

function ordinal(n: number): string {
 const s = ['th', 'st', 'nd', 'rd']
 const v = n % 100
 return s[(v - 20) % 10] ?? s[v] ?? s[0]
}
