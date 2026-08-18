'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useTransition, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { onboardStudentAction } from '@/app/actions/onboarding'
import { OnboardingSchema, type OnboardingFormData } from './schema'
import { useRouter } from 'next/navigation'
import { 
  Loader2, User, BookOpen, CreditCard, AlertCircle, Clock, 
  MapPin, ArrowLeft, Sparkles, UserPlus, CheckCircle2,
  Calendar, ShieldCheck, DollarSign
} from 'lucide-react'
import { getSlotSeatSummary, formatSlotTimeRange } from '@/lib/seat-engine'

interface Room {
  id: string
  name: string
  capacity: number
}

interface Slot {
  id: string
  roomId: string
  startTime: string | Date
  endTime: string | Date
  days: string
  room: Room
  courses?: Array<{
    enrollments?: Array<{
      id?: string
      status?: string
      endDate?: Date | string | null
    }>
  }>
}

interface Course {
  id: string
  name: string
  durationMonths: number
  baseFee: number
}

interface Teacher {
  id: string
  firstName: string | null
  lastName: string | null
}

export interface CourseOnSlot {
  id: string
  slotId: string
  courseId: string
  teacherId: string | null
  teacher: Teacher | null
  slot: Slot
  course: Course
  enrollments?: any[]
}

interface StreamlinedAdmissionFormProps {
  assignments: CourseOnSlot[]
  basePath?: '/admin' | '/receptionist'
}

export function StreamlinedAdmissionForm({ assignments, basePath = '/admin' }: StreamlinedAdmissionFormProps) {
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const router = useRouter()
  
  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(OnboardingSchema),
    defaultValues: {
      name: '',
      fatherName: '',
      phone: '',
      address: '',
      isEnrolling: false,
      courseId: '',
      courseOnSlotId: '',
      isPaying: false,
      applyDiscount: false,
      discountType: 'FIXED',
      discountDuration: 'SINGLE_MONTH',
      discountAmount: 0,
      paymentAmount: 0
    }
  })

  const isEnrolling = form.watch('isEnrolling')
  const courseId = form.watch('courseId')
  const courseOnSlotId = form.watch('courseOnSlotId')
  
  const isPaying = form.watch('isPaying')
  const applyDiscount = form.watch('applyDiscount')
  const discountType = form.watch('discountType')
  const discountDuration = form.watch('discountDuration')
  const discountAmount = form.watch('discountAmount') || 0

  // Filter Unique Courses
  const uniqueCourses = useMemo(() => {
    const map = new Map<string, Course>()
    assignments.forEach((a) => {
      if (a.course && !map.has(a.course.id)) {
        map.set(a.course.id, {
          id: a.course.id,
          name: a.course.name,
          durationMonths: a.course.durationMonths,
          baseFee: Number(a.course.baseFee)
        })
      }
    })
    return Array.from(map.values())
  }, [assignments])

  // Filter slots for the selected course and sort by start time ascending
  const availableSlots = useMemo(() => {
    return assignments
      .filter((a) => a.courseId === courseId)
      .sort((a, b) => new Date(a.slot.startTime).getTime() - new Date(b.slot.startTime).getTime())
  }, [assignments, courseId])
  
  const selectedAssignment = useMemo(() => {
    return assignments.find((a) => a.id === courseOnSlotId)
  }, [assignments, courseOnSlotId])

  const getTeacherLabel = (assignment: CourseOnSlot) => {
    if (!assignment.teacher) return 'Teacher TBD'
    const names = [assignment.teacher.firstName, assignment.teacher.lastName].filter(Boolean)
    return names.length > 0 ? names.join(' ') : 'Teacher TBD'
  }

  // Calculate fees dynamically for UI display
  const baseFee = selectedAssignment ? Number(selectedAssignment.course.baseFee) : 0
  
  const calculatedDiscount = useMemo(() => {
    if (!applyDiscount || !discountAmount || discountAmount <= 0) return 0
    if (discountType === 'FIXED') {
      return Math.min(baseFee, discountAmount)
    }
    return Math.min(baseFee, baseFee * (discountAmount / 100))
  }, [applyDiscount, discountType, discountAmount, baseFee])

  const finalFee = Math.max(0, baseFee - calculatedDiscount)

  // Auto set paymentAmount to finalFee when isPaying is toggled on or finalFee changes
  useEffect(() => {
    if (isPaying && finalFee > 0) {
      const currentVal = form.getValues('paymentAmount')
      if (currentVal === 0 || currentVal === undefined) {
        form.setValue('paymentAmount', finalFee)
      }
    }
  }, [isPaying, finalFee, form])

  const onSubmit = (data: OnboardingFormData) => {
    setServerError(null)
    startTransition(async () => {
      const result = await onboardStudentAction(data)
      if (result.success) {
        router.push(`${basePath}/students/${result.studentId}`)
        router.refresh()
      } else {
        setServerError(result.error || 'An error occurred during admission.')
      }
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {serverError && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-4 text-red-700 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Admission Failed</p>
            <p className="text-sm">{serverError}</p>
          </div>
        </div>
      )}

      {/* --- STEP 1: Student Information (Required) --- */}
      <div className="rounded-[28px] border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-600 font-bold text-white shadow-xs">
              1
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Student Information</h2>
              <p className="text-xs text-muted-foreground">Basic student biodata and contact details</p>
            </div>
          </div>
          <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            Required
          </span>
        </div>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">Full Name *</label>
            <input 
              {...form.register('name')}
              placeholder="e.g. Muhammad Ali"
              className="w-full rounded-2xl border border-border bg-muted/60 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-indigo-500 focus:bg-card focus:ring-2 focus:ring-indigo-500/20"
            />
            {form.formState.errors.name && (
              <p className="mt-1 text-xs text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">Father's Name *</label>
            <input 
              {...form.register('fatherName')}
              placeholder="e.g. Ahmed Khan"
              className="w-full rounded-2xl border border-border bg-muted/60 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-indigo-500 focus:bg-card focus:ring-2 focus:ring-indigo-500/20"
            />
            {form.formState.errors.fatherName && (
              <p className="mt-1 text-xs text-red-500">{form.formState.errors.fatherName.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">Phone Number *</label>
            <input 
              {...form.register('phone')}
              type="tel"
              placeholder="0300-1234567"
              className="w-full rounded-2xl border border-border bg-muted/60 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-indigo-500 focus:bg-card focus:ring-2 focus:ring-indigo-500/20"
            />
            {form.formState.errors.phone && (
              <p className="mt-1 text-xs text-red-500">{form.formState.errors.phone.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">
              Address <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
            </label>
            <input 
              {...form.register('address')}
              placeholder="e.g. Street 4, Sector G-9, Islamabad"
              className="w-full rounded-2xl border border-border bg-muted/60 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-indigo-500 focus:bg-card focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* Step 2 Toggle Card */}
        <div className="mt-6 pt-4 border-t border-border">
          <label className={`flex cursor-pointer items-center justify-between rounded-[22px] border-2 p-4 transition-all ${
            isEnrolling 
              ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/30' 
              : 'border-border bg-muted/30 hover:border-border/80'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                isEnrolling ? 'bg-indigo-600 text-white' : 'bg-muted text-muted-foreground'
              }`}>
                <BookOpen size={20} />
              </div>
              <div>
                <span className="block font-semibold text-foreground">Enroll in a Course Now?</span>
                <span className="text-xs text-muted-foreground">Select a course, room, and time slot immediately upon admission.</span>
              </div>
            </div>
            <input 
              type="checkbox" 
              {...form.register('isEnrolling')} 
              className="h-5 w-5 rounded border-border text-indigo-600 focus:ring-indigo-600 cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* --- STEP 2: Course & Timing Slot Enrollment (Optional) --- */}
      <AnimatePresence>
        {isEnrolling && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden space-y-6"
          >
            <div className="rounded-[28px] border border-border bg-card p-6 shadow-sm sm:p-8">
              <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-cyan-600 font-bold text-white shadow-xs">
                    2
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Course & Timing Selection</h2>
                    <p className="text-xs text-muted-foreground">Pick the course and an available room slot</p>
                  </div>
                </div>
                <span className="rounded-full bg-cyan-50 dark:bg-cyan-950/50 px-3 py-1 text-xs font-semibold text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                  Optional Step
                </span>
              </div>

              {/* Course Dropdown */}
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-foreground">Select Course *</label>
                  <select 
                    {...form.register('courseId')}
                    className="w-full rounded-2xl border border-border bg-muted/60 px-4 py-3 text-sm text-foreground shadow-xs outline-none transition focus:border-cyan-500 focus:bg-card focus:ring-2 focus:ring-cyan-500/20"
                  >
                    <option value="">-- Choose a Course --</option>
                    {uniqueCourses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.durationMonths} Months) • Standard Fee: PKR {c.baseFee.toLocaleString()}
                      </option>
                    ))}
                  </select>
                  {form.formState.errors.courseId && (
                    <p className="mt-1 text-xs text-red-500">{form.formState.errors.courseId.message}</p>
                  )}
                </div>

                {/* Available Time Slots with Live Seat Engine */}
                {courseId && (
                  <div className="mt-6 space-y-3">
                    <label className="block text-sm font-semibold text-foreground">
                      Choose Timing Slot & Room *
                    </label>

                    {availableSlots.length === 0 ? (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30 p-4 text-sm text-amber-800 dark:text-amber-300">
                        No time slots are currently assigned to this course. Please configure course slots in the schedule manager.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {availableSlots.map((a) => {
                          const enrollmentsInSlot = (a.slot?.courses || []).flatMap((c) => c.enrollments || [])
                          const seatSummary = getSlotSeatSummary(a.slot.room.capacity, enrollmentsInSlot, {
                            id: a.slot.id,
                            roomName: a.slot.room.name,
                            days: a.slot.days,
                            startTime: a.slot.startTime,
                            endTime: a.slot.endTime
                          })
                          const isFull = seatSummary.status === 'FULL'
                          const isNearlyFull = seatSummary.status === 'ALMOST_FULL'
                          const badgeText = isFull 
                            ? 'FULL' 
                            : `${seatSummary.availableSeats} of ${seatSummary.roomCapacity} Free`
                          const timeRange = formatSlotTimeRange(a.slot.startTime, a.slot.endTime)
                          const isSelected = courseOnSlotId === a.id

                          return (
                            <label
                              key={a.id}
                              className={`flex cursor-pointer flex-col justify-between rounded-[22px] border-2 p-4 transition-all ${
                                isSelected
                                  ? 'border-cyan-500 bg-cyan-50/70 dark:bg-cyan-950/40 shadow-xs'
                                  : isFull
                                  ? 'border-border/60 bg-muted/40 opacity-70 cursor-not-allowed'
                                  : 'border-border bg-card hover:border-border/80'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-foreground text-sm">{timeRange}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Clock size={13} />
                                    <span>{a.slot.days}</span>
                                    <span>•</span>
                                    <MapPin size={13} />
                                    <span>{a.slot.room.name}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                                    <User size={13} />
                                    <span>{getTeacherLabel(a)}</span>
                                  </div>
                                </div>
                                <input
                                  type="radio"
                                  {...form.register('courseOnSlotId')}
                                  value={a.id}
                                  disabled={isFull}
                                  className="mt-1 h-4 w-4 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                                />
                              </div>

                              {/* Capacity Bar & Badge */}
                              <div className="mt-4 pt-3 border-t border-border/80">
                                <div className="flex items-center justify-between text-xs mb-1.5">
                                  <span className="text-muted-foreground">Room Capacity</span>
                                  <span className={`font-semibold ${
                                    isFull 
                                      ? 'text-rose-600 dark:text-rose-400' 
                                      : isNearlyFull 
                                      ? 'text-amber-600 dark:text-amber-400' 
                                      : 'text-emerald-600 dark:text-emerald-400'
                                  }`}>
                                    {badgeText}
                                  </span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      isFull 
                                        ? 'bg-rose-500' 
                                        : isNearlyFull 
                                        ? 'bg-amber-500' 
                                        : 'bg-emerald-500'
                                    }`}
                                    style={{ width: `${seatSummary.occupancyPercent}%` }}
                                  />
                                </div>
                              </div>
                            </label>
                          )
                        })}
                      </div>
                    )}
                    {form.formState.errors.courseOnSlotId && (
                      <p className="mt-1 text-xs text-red-500">{form.formState.errors.courseOnSlotId.message}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Step 3 Toggle Card */}
              {courseOnSlotId && (
                <div className="mt-6 pt-4 border-t border-border">
                  <label className={`flex cursor-pointer items-center justify-between rounded-[22px] border-2 p-4 transition-all ${
                    isPaying 
                      ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30' 
                      : 'border-border bg-muted/30 hover:border-border/80'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                        isPaying ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'
                      }`}>
                        <CreditCard size={20} />
                      </div>
                      <div>
                        <span className="block font-semibold text-foreground">Collect Initial Fee & Apply Discount?</span>
                        <span className="text-xs text-muted-foreground">Optionally record payment or discount now. If left off, an unpaid voucher is created.</span>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      {...form.register('isPaying')} 
                      className="h-5 w-5 rounded border-border text-emerald-600 focus:ring-emerald-600 cursor-pointer"
                    />
                  </label>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- STEP 3: Fee Payment & Discount (Optional) --- */}
      <AnimatePresence>
        {isEnrolling && courseOnSlotId && isPaying && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="rounded-[28px] border border-border bg-card p-6 shadow-sm sm:p-8">
              <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-600 font-bold text-white shadow-xs">
                    3
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Fee Collection & Discounts</h2>
                    <p className="text-xs text-muted-foreground">Record initial payment or apply a fee concession</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Optional Step
                </span>
              </div>

              <div className="space-y-6">
                {/* Discount Section */}
                <div className="rounded-2xl border border-border p-4 bg-muted/20">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-semibold text-foreground text-sm">Apply Concession / Discount?</span>
                    <input 
                      type="checkbox" 
                      {...form.register('applyDiscount')} 
                      className="h-5 w-5 rounded border-border text-emerald-600 focus:ring-emerald-600 cursor-pointer"
                    />
                  </label>

                  <AnimatePresence>
                    {applyDiscount && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 space-y-4 border-t border-border pt-4"
                      >
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Discount Type *
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              <label className={`flex items-center justify-center rounded-xl border p-2.5 text-xs font-semibold cursor-pointer transition ${
                                discountType === 'FIXED' 
                                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' 
                                  : 'border-border bg-muted/60 text-muted-foreground'
                              }`}>
                                <input type="radio" {...form.register('discountType')} value="FIXED" className="sr-only" />
                                Fixed PKR
                              </label>
                              <label className={`flex items-center justify-center rounded-xl border p-2.5 text-xs font-semibold cursor-pointer transition ${
                                discountType === 'PERCENTAGE' 
                                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' 
                                  : 'border-border bg-muted/60 text-muted-foreground'
                              }`}>
                                <input type="radio" {...form.register('discountType')} value="PERCENTAGE" className="sr-only" />
                                Percentage %
                              </label>
                            </div>
                          </div>

                          <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Discount Amount *
                            </label>
                            <input
                              type="number"
                              {...form.register('discountAmount', { valueAsNumber: true })}
                              placeholder={discountType === 'FIXED' ? 'e.g. 500' : 'e.g. 10'}
                              className="w-full rounded-2xl border border-border bg-muted/60 px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-emerald-500 focus:bg-card focus:ring-2 focus:ring-emerald-500/20"
                            />
                            {form.formState.errors.discountAmount && (
                              <p className="mt-1 text-xs text-red-500">{form.formState.errors.discountAmount.message}</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Discount Duration *
                          </label>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <label className={`flex items-start gap-3 rounded-2xl border p-3 cursor-pointer transition ${
                              discountDuration === 'SINGLE_MONTH' 
                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' 
                                : 'border-border bg-muted/40'
                            }`}>
                              <input type="radio" {...form.register('discountDuration')} value="SINGLE_MONTH" className="mt-0.5 text-emerald-600" />
                              <div>
                                <span className="text-xs font-bold text-foreground">First Month Only</span>
                                <p className="text-[11px] text-muted-foreground">Applies only to this admission month.</p>
                              </div>
                            </label>
                            <label className={`flex items-start gap-3 rounded-2xl border p-3 cursor-pointer transition ${
                              discountDuration === 'ENTIRE_COURSE' 
                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' 
                                : 'border-border bg-muted/40'
                            }`}>
                              <input type="radio" {...form.register('discountDuration')} value="ENTIRE_COURSE" className="mt-0.5 text-emerald-600" />
                              <div>
                                <span className="text-xs font-bold text-foreground">Entire Course Duration</span>
                                <p className="text-[11px] text-muted-foreground">Applies to all monthly fee cycles.</p>
                              </div>
                            </label>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Calculation Summary & Payment Input */}
                <div className="rounded-2xl border border-border bg-muted/40 p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-sm border-b border-border pb-3">
                    <span className="text-muted-foreground">Base Course Fee:</span>
                    <span className="text-right font-semibold text-foreground">PKR {baseFee.toLocaleString()}</span>
                    {applyDiscount && (
                      <>
                        <span className="text-emerald-600 dark:text-emerald-400">Applied Concession:</span>
                        <span className="text-right font-semibold text-emerald-600 dark:text-emerald-400">
                          - PKR {calculatedDiscount.toLocaleString()}
                        </span>
                      </>
                    )}
                    <span className="font-bold text-foreground pt-1">Payable Fee:</span>
                    <span className="text-right font-bold text-foreground text-base pt-1">
                      PKR {finalFee.toLocaleString()}
                    </span>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-foreground">
                      Amount Collected Right Now (PKR) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                        PKR
                      </span>
                      <input 
                        type="number" 
                        {...form.register('paymentAmount', { valueAsNumber: true })}
                        placeholder="0"
                        className="w-full rounded-2xl border border-border bg-card pl-14 pr-4 py-3 text-base font-bold text-foreground outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    {form.formState.errors.paymentAmount && (
                      <p className="mt-1 text-xs text-red-500">{form.formState.errors.paymentAmount.message}</p>
                    )}
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      Enter <strong>0</strong> for fully unpaid/pay-later setup, or enter <strong>{finalFee}</strong> for full payment.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Button */}
      <div className="pt-2">
        <button 
          type="submit" 
          disabled={isPending} 
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 dark:bg-white px-6 py-4 text-base font-bold text-white dark:text-slate-950 transition hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-50 shadow-md cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing Admission & Setup...
            </>
          ) : (
            <>
              <CheckCircle2 size={18} />
              Confirm & Complete Admission
            </>
          )}
        </button>
      </div>
    </form>
  )
}
