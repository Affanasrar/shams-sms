'use client'

import { useState } from 'react'
import { CalendarDays, Clock3, MapPin, Plus } from 'lucide-react'
import { ExtendCourseModal } from './extend-course-modal'

interface Enrollment {
 id: string
 joiningDate: string // ISO date string
 endDate: string | null // ISO date string
 extendedDays: number
 status: string
 courseOnSlot: {
 course: {
 name: string
 durationMonths: number
 }
 slot: {
 days: string
 startTime: string // ISO date string
 room?: {
 name: string
 }
 }
 }
}

interface EnrollmentTableProps {
 enrollments: Enrollment[]
}

function StatusBadge({ status }: { status: string }) {
 const statusStyles = {
 ACTIVE: 'bg-green-100 text-green-800 dark:text-green-300',
 COMPLETED: 'bg-blue-100 text-blue-800 dark:text-blue-300',
 DROPPED: 'bg-red-100 text-red-800 dark:text-red-300'
 }

 return (
 <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status as keyof typeof statusStyles] || 'bg-muted text-foreground'}`}>
 {status}
 </span>
 )
}

export function EnrollmentTable({ enrollments }: EnrollmentTableProps) {
 const [selectedEnrollment, setSelectedEnrollment] = useState<{ id: string; courseName: string } | null>(null)

 return (
 <>
 <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
 <div className="border-b border-border bg-muted px-6 py-4">
 <h3 className="text-lg font-semibold text-foreground">Active enrollments</h3>
 <p className="text-sm text-muted-foreground">Courses, timing, and lifecycle status in one view.</p>
 </div>
 <table className="w-full text-left text-sm">
 <thead className="bg-card text-muted-foreground">
 <tr>
 <th className="px-6 py-4 font-medium">Course</th>
 <th className="px-6 py-4 font-medium">Timing</th>
 <th className="px-6 py-4 font-medium">Joining</th>
 <th className="px-6 py-4 font-medium">End Date</th>
 <th className="px-6 py-4 font-medium">Status</th>
 <th className="px-6 py-4 font-medium text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {enrollments.map(enr => {
 // Calculate end date: joining date + course duration months + extended days
 const joiningDate = new Date(enr.joiningDate)
 const courseDurationMs = enr.courseOnSlot.course.durationMonths * 30 * 24 * 60 * 60 * 1000 // Approximate months to ms
 const extendedDaysMs = (enr.extendedDays || 0) * 24 * 60 * 60 * 1000
 const calculatedEndDate = new Date(joiningDate.getTime() + courseDurationMs + extendedDaysMs)
 const actualEndDate = enr.endDate ? new Date(enr.endDate) : calculatedEndDate

 return (
 <tr key={enr.id} className="transition hover:bg-muted/70">
 <td className="px-6 py-5">
 <div className="space-y-1">
 <p className="font-semibold text-foreground">{enr.courseOnSlot.course.name}</p>
 <p className="font-mono text-xs text-muted-foreground">{enr.id}</p>
 </div>
 </td>
 <td className="px-6 py-5 text-muted-foreground">
 <div className="space-y-1 rounded-2xl bg-muted px-3 py-2">
 <div className="inline-flex items-center gap-2 text-xs font-medium text-foreground">
 <Clock3 size={14} />
 {new Date(enr.courseOnSlot.slot.startTime).toLocaleTimeString('en-US', {
 hour: 'numeric',
 minute: '2-digit',
 hour12: true,
 timeZone: 'Asia/Karachi'
 })}
 </div>
 <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
 <MapPin size={14} />
 {enr.courseOnSlot.slot.room?.name || 'Lab location'}
 </div>
 </div>
 </td>
 <td className="px-6 py-5 text-muted-foreground">
 <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-foreground">
 <CalendarDays size={14} />
 {joiningDate.toLocaleDateString('en-US', { timeZone: 'Asia/Karachi' })}
 </div>
 </td>
 <td className="px-6 py-5 text-muted-foreground">
 {actualEndDate.toLocaleDateString('en-US', { timeZone: 'Asia/Karachi' })}
 {enr.extendedDays > 0 && (
 <span className="text-xs block text-orange-600 dark:text-orange-300">
 +{enr.extendedDays} days extended
 </span>
 )}
 </td>
 <td className="px-6 py-5">
 <StatusBadge status={enr.status} />
 </td>
 <td className="px-6 py-5 text-right">
 {enr.status === 'ACTIVE' && (
 <button
 onClick={() => setSelectedEnrollment({ id: enr.id, courseName: enr.courseOnSlot.course.name })}
 className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground transition hover:border-border hover:bg-muted"
 title="Extend Course Duration"
 >
 <Plus size={14} /> Extend
 </button>
 )}
 </td>
 </tr>
 )
 })}
 </tbody>
 </table>
 </div>

 <ExtendCourseModal
 enrollmentId={selectedEnrollment?.id || ''}
 courseName={selectedEnrollment?.courseName || ''}
 isOpen={!!selectedEnrollment}
 onClose={() => setSelectedEnrollment(null)}
 />
 </>
 )
}