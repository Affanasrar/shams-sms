import prisma from '@/lib/prisma'
import { ArrowLeft, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'
import { EditEnrollmentForm } from './edit-enrollment-form'

export default async function EditEnrollmentPage({ params }: { params: Promise<{ id: string }> }) {
 noStore()
 const { id } = await params

 const enrollment = await prisma.enrollment.findUnique({
 where: { id },
 include: {
 student: true,
 courseOnSlot: {
 include: {
 course: true,
 slot: { include: { room: true } }
 }
 }
 }
 })

 if (!enrollment) {
 notFound()
 }

 const assignments = await prisma.courseOnSlot.findMany({
 include: {
 course: true,
 slot: { include: { room: true } }
 },
 orderBy: [
 { course: { name: 'asc' } },
 { slot: { startTime: 'asc' } }
 ]
 })

 return (
 <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.14),transparent_34%)] px-4 py-8 sm:px-6 lg:px-8">
 <div className="mx-auto max-w-4xl">

 {/* ── Page header card ── */}
 <div className="mb-8 rounded-[32px] border border-border/80 bg-card/80 p-6 shadow-[0_24px_70px_-28px_rgba(15,23,42,0.32)] backdrop-blur-xl sm:p-8">
 <Link
 href="/admin/enrollment"
 className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-300 transition hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
 >
 <ArrowLeft size={18} />
 Back to Enrollments
 </Link>

 <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
 <div>
 <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 text-sm font-medium text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
 <BookOpen size={16} />
 Edit enrollment
 </div>
 <h1 className="text-3xl font-semibold tracking-tight text-foreground ">
 {enrollment.student.name}
 </h1>
 <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
 Update the enrollment date, course, or time slot. Fee due dates will be recalculated automatically.
 </p>
 </div>
 <div className="rounded-2xl border border-border bg-muted px-4 py-3 text-sm text-muted-foreground ">
 <p className="font-semibold text-foreground ">4 guided steps</p>
 <p className="mt-1">Date · Course · Slot · Confirm</p>
 </div>
 </div>
 </div>

 {/* ── Form card ── */}
 <div className="overflow-hidden rounded-[32px] border border-border/80 bg-card/90 shadow-[0_24px_70px_-28px_rgba(15,23,42,0.32)] ">
 <div className="bg-linear-to-r from-slate-900 via-indigo-900 to-slate-900 px-6 py-4 text-white sm:px-8">
 <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-200">Step-by-step edit</p>
 <p className="mt-1 text-base font-medium">
 Currently enrolled: <span className="text-indigo-200">{enrollment.courseOnSlot.course.name}</span>
 </p>
 </div>

 <div className="p-5 sm:p-8">
 <EditEnrollmentForm
 enrollment={{
 id: enrollment.id,
 studentId: enrollment.studentId,
 studentName: enrollment.student.name,
 currentCourseOnSlotId: enrollment.courseOnSlotId,
 currentCourseName: enrollment.courseOnSlot.course.name,
 currentSlotLabel: enrollment.courseOnSlot.slot.days,
 currentSlotTime: enrollment.courseOnSlot.slot.startTime,
 currentSlotRoom: enrollment.courseOnSlot.slot.room.name,
 joiningDate: enrollment.joiningDate.toISOString().slice(0, 10)
 }}
 assignments={assignments.map((assignment) => ({
 id: assignment.id,
 courseId: assignment.courseId,
 courseName: assignment.course.name,
 slotLabel: assignment.slot.days,
 slotStartTime: assignment.slot.startTime.toISOString(),
 slotEndTime: assignment.slot.endTime.toISOString(),
 roomName: assignment.slot.room.name,
 roomCapacity: assignment.slot.room.capacity
 }))}
 />
 </div>
 </div>

 {/* ── Help note ── */}
 <div className="mt-8 rounded-[24px] border border-border/80 bg-card/80 p-4 text-sm text-muted-foreground shadow-[0_20px_60px_-28px_rgba(15,23,42,0.24)] backdrop-blur-xl ">
 <span className="font-semibold text-foreground ">Tip:</span> Backdating the enrollment date will automatically generate any missing monthly fee records for the student.
 </div>
 </div>
 </div>
 )
}
