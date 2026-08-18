// app/admin/completed-students/completed-students-client.tsx
'use client'

import { useState } from 'react'
import { markAsCompleted, extendAndReactivate } from '@/app/actions/course-completion'
import { GraduationCap, Clock, CheckCircle2, RotateCcw, Calendar, Users, AlertCircle } from 'lucide-react'

type Enrollment = {
 id: string
 studentId: string
 joiningDate: string
 endDate: string | null
 extendedDays: number
 completedAt: string | null
 status: string
 student: {
 id: string
 studentId: string
 name: string
 fatherName: string
 phone: string
 }
 courseOnSlot: {
 course: { name: string; durationMonths: number }
 slot: {
 days: string
 startTime: string
 endTime: string
 room: { name: string }
 }
 }
}

type Props = {
 pendingEnrollments: Enrollment[]
 completedEnrollments: Enrollment[]
}

export default function CompletedStudentsClient({ pendingEnrollments, completedEnrollments }: Props) {
 const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending')
 const [searchQuery, setSearchQuery] = useState('')
 const [selectedCourse, setSelectedCourse] = useState('')
 const [extendModal, setExtendModal] = useState<{ enrollmentId: string; studentName: string; courseName: string } | null>(null)
 const [additionalMonths, setAdditionalMonths] = useState(1)
 const [loading, setLoading] = useState<string | null>(null)
 const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

 // Extract unique courses for filter
 const allCourses = Array.from(new Set([
 ...pendingEnrollments.map(e => e.courseOnSlot.course.name),
 ...completedEnrollments.map(e => e.courseOnSlot.course.name)
 ])).sort()

 const filterEnrollments = (list: Enrollment[]) => {
 return list.filter(e => {
 const matchesSearch = !searchQuery.trim() || 
 e.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
 e.student.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
 e.student.fatherName.toLowerCase().includes(searchQuery.toLowerCase())
 const matchesCourse = !selectedCourse || e.courseOnSlot.course.name === selectedCourse
 return matchesSearch && matchesCourse
 })
 }

 const filteredPending = filterEnrollments(pendingEnrollments)
 const filteredCompleted = filterEnrollments(completedEnrollments)

 const handleComplete = async (enrollmentId: string) => {
 if (!confirm('Are you sure you want to mark this student as completed? This will vacate their seat.')) return
 setLoading(enrollmentId)
 setMessage(null)
 const formData = new FormData()
 formData.set('enrollmentId', enrollmentId)
 const result = await markAsCompleted(formData)
 setLoading(null)
 setMessage({ type: result.success ? 'success' : 'error', text: result.message || result.error || '' })
 }

 const handleExtend = async () => {
 if (!extendModal) return
 setLoading(extendModal.enrollmentId)
 setMessage(null)
 const formData = new FormData()
 formData.set('enrollmentId', extendModal.enrollmentId)
 formData.set('additionalMonths', String(additionalMonths))
 const result = await extendAndReactivate(formData)
 setLoading(null)
 setExtendModal(null)
 setAdditionalMonths(1)
 setMessage({ type: result.success ? 'success' : 'error', text: result.message || result.error || '' })
 }

 const formatDate = (dateStr: string | null) => {
 if (!dateStr) return '—'
 return new Date(dateStr).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
 }

 const formatTime = (dateStr: string) => {
 return new Date(dateStr).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })
 }

 return (
 <div className="space-y-6">
 {/* Header */}
 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
 <div>
 <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
 <GraduationCap className="text-indigo-600 dark:text-indigo-400" size={28} />
 Course Completions
 </h1>
 <p className="text-sm text-muted-foreground mt-1">
 Manage students who have completed their course duration
 </p>
 </div>
 <div className="flex items-center gap-3">
 <span className="px-3 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-full text-sm font-medium border border-amber-200 dark:border-amber-800/50">
 {pendingEnrollments.length} Pending
 </span>
 <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-full text-sm font-medium border border-emerald-200 dark:border-emerald-800/50">
 {completedEnrollments.length} Completed
 </span>
 </div>
 </div>

 {/* Status message */}
 {message && (
 <div className={`p-4 rounded-xl border ${message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'}`}>
 {message.text}
 </div>
 )}

 {/* Controls: Search & Filters */}
 <div className="card-surface p-4 flex flex-col sm:flex-row gap-3 items-center justify-between ">
 <div className="flex flex-1 gap-3 w-full sm:w-auto">
 <input
 type="text"
 placeholder="Search student name or ID..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-indigo-500 "
 />
 <select
 value={selectedCourse}
 onChange={(e) => setSelectedCourse(e.target.value)}
 className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-indigo-500 "
 >
 <option value="">All Courses</option>
 {allCourses.map(course => (
 <option key={course} value={course}>{course}</option>
 ))}
 </select>
 </div>

 {/* Tabs */}
 <div className="flex gap-1 bg-muted p-1 rounded-xl w-full sm:w-auto">
 <button
 onClick={() => setActiveTab('pending')}
 className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'pending' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground '}`}
 >
 <div className="flex items-center justify-center gap-2">
 <Clock size={16} />
 Pending ({filteredPending.length})
 </div>
 </button>
 <button
 onClick={() => setActiveTab('completed')}
 className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'completed' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground '}`}
 >
 <div className="flex items-center justify-center gap-2">
 <CheckCircle2 size={16} />
 Completed ({filteredCompleted.length})
 </div>
 </button>
 </div>
 </div>

 {/* Pending Tab */}
 {activeTab === 'pending' && (
 <div>
 {filteredPending.length === 0 ? (
 <div className="card-surface p-12 text-center text-muted-foreground ">
 <GraduationCap size={48} className="mx-auto mb-4 opacity-30" />
 <p className="text-lg font-medium text-foreground ">No pending completions found</p>
 <p className="text-sm">
 {searchQuery || selectedCourse ? 'Try adjusting your search filters' : 'Students whose course duration has ended will appear here'}
 </p>
 </div>
 ) : (
 <div className="grid gap-4">
 {filteredPending.map((enrollment) => (
 <div key={enrollment.id} className="card-surface p-5 border-amber-300/60 dark:border-amber-700/50 transition-shadow">
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
 <div className="flex-1 space-y-2">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-amber-100 dark:bg-amber-950/80 rounded-full flex items-center justify-center text-amber-700 dark:text-amber-300 font-bold text-sm">
 {enrollment.student.name.charAt(0)}
 </div>
 <div>
 <h3 className="font-semibold text-foreground ">{enrollment.student.name}</h3>
 <p className="text-sm text-muted-foreground ">{enrollment.student.studentId} • S/o {enrollment.student.fatherName}</p>
 </div>
 </div>
 <div className="flex flex-wrap gap-4 text-sm text-muted-foreground ">
 <span className="flex items-center gap-1">
 <GraduationCap size={14} className="text-indigo-600 dark:text-indigo-400" /> {enrollment.courseOnSlot.course.name}
 </span>
 <span className="flex items-center gap-1">
 <Calendar size={14} className="text-sky-600 dark:text-sky-400" /> {formatDate(enrollment.joiningDate)} → {formatDate(enrollment.endDate)}
 </span>
 <span className="flex items-center gap-1">
 <Users size={14} className="text-emerald-600 dark:text-emerald-400" /> {enrollment.courseOnSlot.slot.room.name} • {enrollment.courseOnSlot.slot.days}
 </span>
 <span className="flex items-center gap-1">
 <Clock size={14} className="text-amber-600 dark:text-amber-400" /> {formatTime(enrollment.courseOnSlot.slot.startTime)} - {formatTime(enrollment.courseOnSlot.slot.endTime)}
 </span>
 </div>
 <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 text-sm font-medium">
 <AlertCircle size={14} />
 <span>Student still occupies a seat until action is taken</span>
 </div>
 </div>

 <div className="flex gap-2 shrink-0">
 <button
 onClick={() => setExtendModal({
 enrollmentId: enrollment.id,
 studentName: enrollment.student.name,
 courseName: enrollment.courseOnSlot.course.name,
 })}
 disabled={loading === enrollment.id}
 className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50 text-sm font-medium flex items-center gap-2 transition"
 >
 <RotateCcw size={14} />
 Extend Course
 </button>
 <button
 onClick={() => handleComplete(enrollment.id)}
 disabled={loading === enrollment.id}
 className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl disabled:opacity-50 text-sm font-medium flex items-center gap-2 transition"
 >
 <CheckCircle2 size={14} />
 {loading === enrollment.id ? 'Processing...' : 'Mark Completed'}
 </button>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 )}

 {/* Completed Tab */}
 {activeTab === 'completed' && (
 <div>
 {filteredCompleted.length === 0 ? (
 <div className="card-surface p-12 text-center text-muted-foreground ">
 <CheckCircle2 size={48} className="mx-auto mb-4 opacity-30" />
 <p className="text-lg font-medium text-foreground ">No completed enrollments found</p>
 </div>
 ) : (
 <div className="card-surface overflow-hidden ">
 <div className="overflow-x-auto">
 <table className="w-full text-sm text-left">
 <thead>
 <tr className="border-b border-border bg-muted text-muted-foreground ">
 <th className="px-5 py-3 font.medium">Student</th>
 <th className="px-5 py-3 font-medium hidden sm:table-cell">Course</th>
 <th className="px-5 py-3 font-medium hidden md:table-cell">Duration</th>
 <th className="px-5 py-3 font-medium">Completed On</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
 {filteredCompleted.map((enrollment) => (
 <tr key={enrollment.id} className="hover:bg-muted transition">
 <td className="px-5 py-3.5">
 <div className="font-medium text-foreground ">{enrollment.student.name}</div>
 <div className="text-xs text-muted-foreground ">{enrollment.student.studentId} • S/o {enrollment.student.fatherName}</div>
 </td>
 <td className="px-5 py-3.5 hidden sm:table-cell text-foreground ">
 {enrollment.courseOnSlot.course.name}
 </td>
 <td className="px-5 py-3.5 hidden md:table-cell text-muted-foreground ">
 {formatDate(enrollment.joiningDate)} → {formatDate(enrollment.endDate)}
 </td>
 <td className="px-5 py-3.5">
 <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-medium border border-emerald-200 dark:border-emerald-800/50">
 <CheckCircle2 size={12} />
 {formatDate(enrollment.completedAt)}
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}
 </div>
 )}

 {/* Extend Modal */}
 {extendModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs">
 <div className="card-surface p-6 w-full max-w-md mx-4 ">
 <h2 className="text-lg font-bold text-foreground mb-2">Extend Course</h2>
 <p className="text-sm text-muted-foreground mb-4">
 Extend <strong>{extendModal.studentName}</strong>&apos;s enrollment in <strong>{extendModal.courseName}</strong>. This will reactivate their enrollment and generate a new fee cycle.
 </p>
 <div className="mb-4">
 <label className="block text-sm font-medium text-foreground mb-1">Additional Months</label>
 <input
 type="number"
 min={1}
 max={12}
 value={additionalMonths}
 onChange={(e) => setAdditionalMonths(parseInt(e.target.value) || 1)}
 className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 "
 />
 </div>
 <div className="flex gap-3 justify-end">
 <button
 onClick={() => { setExtendModal(null); setAdditionalMonths(1) }}
 className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground "
 >
 Cancel
 </button>
 <button
 onClick={handleExtend}
 disabled={loading === extendModal.enrollmentId}
 className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50 text-sm font-medium"
 >
 {loading === extendModal.enrollmentId ? 'Extending...' : `Extend by ${additionalMonths} month(s)`}
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 )
}
