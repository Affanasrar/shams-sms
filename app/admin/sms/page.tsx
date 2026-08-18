// app/admin/sms/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { SmsSender } from './sms-sender'
import { MessageSquare, Loader2, AlertCircle } from 'lucide-react'

type SenderStudent = {
 id: string
 studentId: string
 name: string
 fatherName: string
 phone: string | null
 enrollments: Array<{
 courseOnSlot: {
 id: string
 course: {
 id: string
 name: string
 }
 }
 fees?: Array<{
 id: string
 finalAmount: number
 dueDate: string
 cycleDate: string | null
 }>
 }>
}

type CourseSlot = {
 id: string
 course: {
 id: string
 name: string
 }
 slot: {
 startTime: string
 endTime: string
 days: string
 room: {
 name: string
 }
 }
 teacher: {
 id: string
 firstName: string | null
 lastName: string | null
 } | null
}

export default function SmsPage() {
 const [students, setStudents] = useState<SenderStudent[]>([])
 const [courseSlots, setCourseSlots] = useState<CourseSlot[]>([])
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState<string | null>(null)

 const loadData = async () => {
 setLoading(true)
 setError(null)
 try {
 const res = await fetch('/api/admin/sms/inbox?senderData=true')
 if (!res.ok) throw new Error('Failed to load SMS data')
 const data = await res.json()
 setStudents(data.students ?? [])
 setCourseSlots(data.courseSlots ?? [])
 } catch (err) {
 setError(err instanceof Error ? err.message : 'Failed to load data')
 } finally {
 setLoading(false)
 }
 }

 useEffect(() => {
 void loadData()
 }, [])

 return (
 <div className="space-y-6">
 {/* Page Header */}
 <div className="rounded-3xl border border-border bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-2xl shadow-slate-900/20 md:p-8">
 <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
 <div className="max-w-2xl space-y-3">
 <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-50 dark:bg-sky-950/400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">
 <MessageSquare size={12} />
 Custom SMS
 </div>
 <div>
 <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Bulk SMS Sender</h1>
 <p className="mt-2 text-sm leading-6 text-white/70 md:text-base">
 Compose and send personalized messages to students filtered by course or time slot.
 </p>
 </div>
 </div>

 <div className="rounded-2xl border border-white/10 bg-card/8 p-4 backdrop-blur text-right">
 <p className="text-xs uppercase tracking-[0.2em] text-white/55">Students loaded</p>
 <p className="mt-1 text-3xl font-semibold">{loading ? '—' : students.length}</p>
 </div>
 </div>
 </div>

 {/* Content */}
 {loading ? (
 <div className="flex flex-col items-center justify-center gap-4 py-20 text-muted-foreground ">
 <Loader2 size={32} className="animate-spin text-indigo-500" />
 <p className="text-sm font-medium">Loading student data...</p>
 </div>
 ) : error ? (
 <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 py-16 text-center">
 <AlertCircle size={32} className="text-rose-500" />
 <div>
 <p className="font-semibold text-rose-700 dark:text-rose-300">Failed to load SMS data</p>
 <p className="text-sm text-rose-600 dark:text-rose-400 mt-1">{error}</p>
 </div>
 <button
 onClick={() => void loadData()}
 className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
 >
 Try again
 </button>
 </div>
 ) : (
 <SmsSender students={students} courseSlots={courseSlots} />
 )}
 </div>
 )
}