// app/admin/fees/discounts/new/page.tsx
'use client'

import Link from 'next/link'
import { applyStudentDiscount } from '@/app/actions/discount'
import { ArrowLeft, BadgePercent, Check, ChevronsUpDown, Search, Sparkles } from 'lucide-react'
import { useActionState, useEffect, useMemo, useState } from 'react'

type EnrollmentOption = {
 id: string
 student: {
 name: string
 studentId: string
 }
 courseOnSlot: {
 course: {
 name: string
 }
 }
}

export default function NewDiscountPage() {
 const [state, formAction] = useActionState(applyStudentDiscount, { success: false })
 const [enrollmentsList, setEnrollmentsList] = useState<EnrollmentOption[]>([])
 const [loadingEnrollments, setLoadingEnrollments] = useState(true)
 const [selectedEnrollmentId, setSelectedEnrollmentId] = useState('')
 const [enrollmentQuery, setEnrollmentQuery] = useState('')
 const [showEnrollmentPicker, setShowEnrollmentPicker] = useState(false)

 useEffect(() => {
 const fetchEnrollments = async () => {
 const response = await fetch('/api/enrollments')
 const data = await response.json()
 setEnrollmentsList(data)
 setLoadingEnrollments(false)
 }

 fetchEnrollments()
 }, [])

 const selectedEnrollment = enrollmentsList.find((enrollment) => enrollment.id === selectedEnrollmentId)
 const filteredEnrollments = useMemo(() => {
 const query = enrollmentQuery.trim().toLowerCase()
 if (!query) return enrollmentsList

 return enrollmentsList.filter((enrollment) => {
 const name = enrollment.student.name.toLowerCase()
 const studentId = enrollment.student.studentId.toLowerCase()
 const course = enrollment.courseOnSlot.course.name.toLowerCase()
 return name.includes(query) || studentId.includes(query) || course.includes(query)
 })
 }, [enrollmentQuery, enrollmentsList])

 return (
 <div className="space-y-6">
 <div className="rounded-3xl border border-border bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-2xl shadow-slate-900/20 md:p-8">
 <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
 <div className="max-w-2xl space-y-4">
 <div className="flex items-center gap-3 text-white/75">
 <Link href="/admin/fees/discounts" className="rounded-full border border-white/15 p-2 transition hover:bg-card/10 hover:text-white">
 <ArrowLeft size={18} />
 </Link>
 <span className="text-xs uppercase tracking-[0.3em]">Discount setup</span>
 </div>
 <div>
 <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Apply student discount</h1>
 <p className="mt-3 text-sm leading-6 text-white/70 md:text-base">
 Keep the form short, focused, and easy to complete.
 </p>
 </div>
 <div className="flex flex-wrap gap-3">
 <Link
 href="/admin/fees/discounts"
 className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
 >
 <BadgePercent size={16} />
 View Discounts
 </Link>
 <Link
 href="/admin/fees"
 className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-card/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-card/10"
 >
 Fees Collection
 </Link>
 </div>
 </div>

 <div className="grid gap-3 sm:grid-cols-2 xl:w-lg xl:grid-cols-2">
 <div className="rounded-2xl border border-white/10 bg-card/8 p-4 backdrop-blur">
 <p className="text-xs uppercase tracking-[0.2em] text-white/55">Step 1</p>
 <p className="mt-2 text-lg font-semibold">Choose enrollment</p>
 </div>
 <div className="rounded-2xl border border-white/10 bg-card/8 p-4 backdrop-blur">
 <p className="text-xs uppercase tracking-[0.2em] text-white/55">Step 2</p>
 <p className="mt-2 text-lg font-semibold">Set the discount</p>
 </div>
 <div className="rounded-2xl border border-white/10 bg-card/8 p-4 backdrop-blur">
 <p className="text-xs uppercase tracking-[0.2em] text-white/55">Step 3</p>
 <p className="mt-2 text-lg font-semibold">Pick the month</p>
 </div>
 <div className="rounded-2xl border border-white/10 bg-card/8 p-4 backdrop-blur">
 <p className="text-xs uppercase tracking-[0.2em] text-white/55">Result</p>
 <p className="mt-2 text-lg font-semibold">Applied to unpaid fees only</p>
 </div>
 </div>
 </div>
 </div>

 <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
 <div className="rounded-3xl border bg-card p-6 shadow-sm md:p-8">
 {state.success && (
 <div className="mb-6 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 p-4 text-emerald-800 dark:text-emerald-300">
 Discount applied successfully.
 </div>
 )}
 {state.error && (
 <div className="mb-6 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 p-4 text-rose-800 dark:text-rose-300">
 {state.error}
 </div>
 )}

 <form action={formAction} className="space-y-6">
 <div className="space-y-2">
 <label className="block text-sm font-medium text-foreground">
 Select Student &amp; Course *
 </label>
 <input type="hidden" name="enrollmentId" value={selectedEnrollmentId} />

 <div className="relative">
 <button
 type="button"
 onClick={() => setShowEnrollmentPicker((value) => !value)}
 className="flex w-full items-center justify-between gap-4 rounded-2xl border border-border bg-card px-4 py-3 text-left shadow-sm transition hover:border-border hover:bg-muted"
 >
 <div className="min-w-0">
 <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Enrollment</p>
 <p className="truncate text-sm font-medium text-foreground">
 {selectedEnrollment
 ? `${selectedEnrollment.student.name} (${selectedEnrollment.student.studentId})`
 : 'Choose a student enrollment'
 }
 </p>
 <p className="truncate text-xs text-muted-foreground">
 {selectedEnrollment
 ? selectedEnrollment.courseOnSlot.course.name
 : 'Search by student, ID, or course'
 }
 </p>
 </div>
 <ChevronsUpDown size={18} className="shrink-0 text-muted-foreground" />
 </button>

 {showEnrollmentPicker && (
 <div className="absolute z-20 mt-3 w-full overflow-hidden rounded-3xl border border-border bg-card shadow-2xl ring-1 ring-black/5">
 <div className="border-b border-border p-3">
 <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted px-3 py-2">
 <Search size={16} className="text-muted-foreground" />
 <input
 type="text"
 value={enrollmentQuery}
 onChange={(e) => setEnrollmentQuery(e.target.value)}
 onFocus={() => setShowEnrollmentPicker(true)}
 placeholder="Search student, ID, or course..."
 className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
 />
 </div>
 </div>

 <div className="max-h-72 overflow-y-auto p-2">
 {loadingEnrollments ? (
 <div className="px-4 py-6 text-center text-sm text-muted-foreground">Loading enrollments...</div>
 ) : filteredEnrollments.length > 0 ? (
 filteredEnrollments.map((enrollment) => {
 const isSelected = enrollment.id === selectedEnrollmentId
 return (
 <button
 key={enrollment.id}
 type="button"
 onClick={() => {
 setSelectedEnrollmentId(enrollment.id)
 setEnrollmentQuery('')
 setShowEnrollmentPicker(false)
 }}
 className={`flex w-full items-start justify-between gap-4 rounded-2xl px-4 py-3 text-left transition ${
 isSelected ? 'bg-slate-900 text-white' : 'hover:bg-muted'
 }`}
 >
 <div className="min-w-0">
 <p className="truncate text-sm font-semibold">
 {enrollment.student.name}
 </p>
 <p className={`truncate text-xs ${isSelected ? 'text-white/70' : 'text-muted-foreground'}`}>
 {enrollment.student.studentId} • {enrollment.courseOnSlot.course.name}
 </p>
 </div>
 {isSelected && <Check size={16} className="shrink-0" />}
 </button>
 )
 })
 ) : (
 <div className="px-4 py-6 text-center text-sm text-muted-foreground">
 No matching enrollments found.
 </div>
 )}
 </div>
 </div>
 )}
 </div>
 <p className="text-xs text-muted-foreground">Only active enrollments are shown.</p>
 </div>

 <div className="grid gap-4 md:grid-cols-2">
 <div>
 <label className="mb-2 block text-sm font-medium text-foreground">
 Discount Type *
 </label>
 <div className="space-y-2">
 <label className="flex items-center gap-3 rounded-2xl border border-border bg-muted p-3 transition hover:bg-muted">
 <input type="radio" name="discountType" value="FIXED" defaultChecked required />
 <span className="text-sm font-medium text-foreground">Fixed Amount</span>
 </label>
 <label className="flex items-center gap-3 rounded-2xl border border-border bg-muted p-3 transition hover:bg-muted">
 <input type="radio" name="discountType" value="PERCENTAGE" required />
 <span className="text-sm font-medium text-foreground">Percentage</span>
 </label>
 </div>
 </div>

 <div>
 <label className="mb-2 block text-sm font-medium text-foreground">
 Discount Amount *
 </label>
 <input
 type="number"
 step="0.01"
 name="discountAmount"
 placeholder="500 or 10"
 required
 className="w-full rounded-2xl border border-border bg-muted px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-card focus:ring-2 focus:ring-slate-200"
 />
 <p className="mt-1 text-xs text-muted-foreground">Enter either a fixed amount or a percentage.</p>
 </div>
 </div>

 <div>
 <label className="mb-2 block text-sm font-medium text-foreground">
 Discount Duration *
 </label>
 <div className="space-y-2">
 <label className="flex items-start gap-3 rounded-2xl border border-border bg-muted p-3 transition hover:bg-muted">
 <input type="radio" name="discountDuration" value="SINGLE_MONTH" defaultChecked required className="mt-1" />
 <div>
 <span className="text-sm font-medium text-foreground">Single Month</span>
 <p className="text-xs text-muted-foreground">Apply the discount to only one cycle.</p>
 </div>
 </label>
 <label className="flex items-start gap-3 rounded-2xl border border-border bg-muted p-3 transition hover:bg-muted">
 <input type="radio" name="discountDuration" value="ENTIRE_COURSE" required className="mt-1" />
 <div>
 <span className="text-sm font-medium text-foreground">Entire Course</span>
 <p className="text-xs text-muted-foreground">Apply the discount across the full duration.</p>
 </div>
 </label>
 </div>
 </div>

 <div>
 <label className="mb-2 block text-sm font-medium text-foreground">
 Apply From Month (1-based) *
 </label>
 <select
 name="applicableFromMonth"
 required
 className="w-full rounded-2xl border border-border bg-muted px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-card focus:ring-2 focus:ring-slate-200"
 >
 <option value="">Select month...</option>
 <option value="1">Month 1 (First month)</option>
 <option value="2">Month 2</option>
 <option value="3">Month 3</option>
 <option value="4">Month 4</option>
 <option value="5">Month 5</option>
 <option value="6">Month 6</option>
 <option value="7">Month 7</option>
 <option value="8">Month 8</option>
 <option value="9">Month 9</option>
 <option value="10">Month 10</option>
 <option value="11">Month 11</option>
 <option value="12">Month 12</option>
 </select>
 </div>

 <div className="rounded-2xl border border-border bg-muted p-4 text-sm text-muted-foreground">
 Discounts only change unpaid or partially paid fees. Fully paid months stay untouched.
 </div>

 <div className="flex flex-col gap-3 sm:flex-row">
 <button
 type="submit"
 className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 font-medium text-white transition hover:bg-slate-800"
 >
 Apply Discount
 </button>
 <Link
 href="/admin/fees/discounts"
 className="flex-1 rounded-2xl border border-border bg-card px-4 py-3 text-center font-medium text-foreground transition hover:bg-muted"
 >
 Cancel
 </Link>
 </div>
 </form>
 </div>

 <div className="rounded-3xl border bg-card p-6 shadow-sm">
 <div className="flex items-center gap-3 text-foreground">
 <div className="rounded-full bg-muted p-2 text-muted-foreground">
 <Sparkles size={16} />
 </div>
 <div>
 <h2 className="font-semibold">Quick reminder</h2>
 <p className="text-sm text-muted-foreground">Pick one enrollment, one discount type, and the start month. That is enough.</p>
 </div>
 </div>
 </div>
 </div>
 </div>
 )
}