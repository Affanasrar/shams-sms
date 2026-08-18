// app/admin/schedule/[assignmentId]/students/page.tsx
import prisma from '@/lib/prisma'
import { ArrowLeft, Users, Calendar, Clock, MapPin, User, LogOut } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

type Props = {
 params: { assignmentId: string }
}

export default async function EnrolledStudentsPage({ params }: Props) {
 const assignmentId = (await params).assignmentId

 if (!assignmentId) {
 return (
 <div className="max-w-6xl mx-auto space-y-6">
 <div className="flex items-center gap-4">
 <Link
 href="/admin/schedule"
 className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
 >
 <ArrowLeft size={20} />
 Back to Schedule
 </Link>
 </div>
 <div className="bg-card border rounded-lg p-6 text-center">
 <h1 className="text-2xl font-bold text-foreground mb-4">Invalid Assignment ID</h1>
 <p className="text-muted-foreground">The assignment ID is missing or invalid.</p>
 </div>
 </div>
 )
 }

 // Fetch the assignment with enrolled students
 const assignment = await prisma.courseOnSlot.findUnique({
 where: { id: assignmentId },
 include: {
 course: true,
 slot: {
 include: { room: true }
 },
 teacher: true,
 enrollments: {
 where: { status: 'ACTIVE' },
 select: {
 id: true,
 joiningDate: true,
 endDate: true,
 student: {
 select: {
 id: true,
 studentId: true,
 name: true,
 phone: true,
 fatherName: true,
 address: true
 }
 }
 }
 }
 }
 })

 if (!assignment) {
 return (
 <div className="max-w-6xl mx-auto space-y-6">
 <div className="flex items-center gap-4">
 <Link
 href="/admin/schedule"
 className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
 >
 <ArrowLeft size={20} />
 Back to Schedule
 </Link>
 </div>
 <div className="bg-card border rounded-lg p-6 text-center">
 <h1 className="text-2xl font-bold text-foreground mb-4">Course Not Found</h1>
 <p className="text-muted-foreground">The requested course assignment could not be found.</p>
 </div>
 </div>
 )
 }

 // Fetch total enrollments in the same slot across all assignments
 const slotAssignments = await prisma.courseOnSlot.findMany({
 where: { slotId: assignment.slotId },
 include: {
 enrollments: {
 where: { status: 'ACTIVE' }
 }
 }
 })

 const totalEnrollmentsInSlot = slotAssignments.reduce((total, a) => total + a.enrollments.length, 0)
 const enrollmentsInThisCourse = assignment.enrollments.length
 const enrollmentsInOtherCourses = totalEnrollmentsInSlot - enrollmentsInThisCourse
 const effectiveCapacity = assignment.slot.room.capacity - enrollmentsInOtherCourses
 const totalStudents = enrollmentsInThisCourse
 const capacity = effectiveCapacity
 const isFull = totalStudents >= capacity

 // Find the Next Vacancy
 const today = new Date()
 const nextGraduation = assignment.enrollments
 .map(e => e.endDate)
 // Filter out nulls and future dates
 .filter((d): d is Date => d !== null && new Date(d) >= today)
 .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0]

 return (
 <div className="max-w-6xl mx-auto space-y-6">
 {/* Header */}
 <div className="flex items-center gap-4">
 <Link
 href="/admin/schedule"
 className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
 >
 <ArrowLeft size={20} />
 Back to Schedule
 </Link>
 </div>

 {/* Course & Slot Info */}
 <div className="bg-card border rounded-lg p-6">
 <div className="flex items-start justify-between mb-4">
 <div>
 <h1 className="text-2xl font-bold text-foreground">{assignment!.course.name}</h1>
 <p className="text-muted-foreground mt-1">
 Duration: {assignment!.course.durationMonths} months
 </p>
 </div>
 <div className="text-right">
 <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
 totalStudents >= capacity
 ? 'bg-red-100 text-red-800 dark:text-red-300'
 : 'bg-green-100 text-green-800 dark:text-green-300'
 }`}>
 <Users size={16} />
 {totalStudents} / {capacity} Students
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
 <div className="flex items-center gap-2">
 <Clock size={16} className="text-muted-foreground" />
 <span>
 {new Date(assignment!.slot.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })} -
 {new Date(assignment!.slot.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })}
 </span>
 </div>
 <div className="flex items-center gap-2">
 <Calendar size={16} className="text-muted-foreground" />
 <span>{assignment!.slot.days}</span>
 </div>
 <div className="flex items-center gap-2">
 <MapPin size={16} className="text-muted-foreground" />
 <span>{assignment!.slot.room.name}</span>
 </div>
 </div>

 {/* {assignment.teacher && (
 <div className="flex items-center gap-2 mt-3 text-sm">
 <User size={16} className="text-muted-foreground" />
 <span>Teacher: {assignment.teacher.firstName} {assignment.teacher.lastName}</span>
 </div>
 )} */}

 {/* First Seat Available Info */}
 {isFull && nextGraduation && (
 <div className="bg-red-50 dark:bg-red-950/40 p-3 rounded border border-red-100 dark:border-red-900/50 text-sm text-red-700 dark:text-red-300 flex items-start gap-2 mt-4">
 <LogOut size={16} className="mt-0.5 shrink-0"/>
 <div>
 <div className="font-medium">Class is Full</div>
 <div>Next seat opens: <strong>{new Date(nextGraduation).toLocaleDateString('en-US', { timeZone: 'Asia/Karachi' })}</strong></div>
 </div>
 </div>
 )}
 {!isFull && (
 <div className="bg-green-50 dark:bg-green-950/40 p-3 rounded border border-green-100 dark:border-green-900/50 text-sm text-green-700 dark:text-green-300 flex items-start gap-2 mt-4">
 <Users size={16} className="mt-0.5 shrink-0"/>
 <div>
 <div className="font-medium">Seats Available Now</div>
 <div>+{capacity - totalStudents} seats available for enrollment</div>
 </div>
 </div>
 )}
 </div>

 {/* Action Buttons */}
 <div className="bg-card border rounded-lg p-6">
 <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <Link
 href="/admin/fees"
 className="flex items-center justify-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
 >
 <Users size={20} />
 <span className="font-medium">Collect Fees</span>
 </Link>

 <Link
 href="/admin/enrollment/new"
 className="flex items-center justify-center gap-3 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
 >
 <User size={20} />
 <span className="font-medium">New Enrollment</span>
 </Link>

 <Link
 href="/admin/students/new"
 className="flex items-center justify-center gap-3 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
 >
 <User size={20} />
 <span className="font-medium">New Admission</span>
 </Link>
 </div>
 </div>

 {/* Enrolled Students */}
 <div className="bg-card border rounded-lg p-6">
 <h2 className="text-xl font-bold text-foreground mb-4">
 Enrolled Students ({totalStudents})
 </h2>
 {assignment.enrollments.length > 0 ? (
 <div className="space-y-4">
 {assignment.enrollments.map((enrollment) => (
 <div key={enrollment.id} className="bg-muted border rounded-lg p-4">
 <div className="flex items-center justify-between">
 <div>
 <h3 className="font-semibold text-foreground">{enrollment.student.name}</h3>
 <p className="text-sm text-muted-foreground">ID: {enrollment.student.studentId}</p>
 <p className="text-sm text-muted-foreground">Father: {enrollment.student.fatherName}</p>
 <p className="text-sm text-muted-foreground">Phone: {enrollment.student.phone}</p>
 <p className="text-sm text-muted-foreground">Address: {enrollment.student.address}</p>
 </div>
 <div className="text-right text-sm text-muted-foreground">
 <p>Joined: {enrollment.joiningDate.toLocaleDateString()}</p>
 {enrollment.endDate && <p>Ends: {enrollment.endDate.toLocaleDateString()}</p>}
 </div>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="text-center py-8">
 <Users size={48} className="mx-auto text-muted-foreground mb-4" />
 <h3 className="text-lg font-medium text-foreground mb-2">No Students Enrolled</h3>
 <p className="text-muted-foreground">No students are currently enrolled in this course.</p>
 </div>
 )}
 </div>
 </div>
 );
}