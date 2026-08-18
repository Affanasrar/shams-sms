// app/admin/enrollment/new/enrollment-form.tsx
'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { enrollStudent } from '@/app/actions/enrollment'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Check, AlertCircle, Clock, MapPin, BookOpen, ArrowRight, Loader2, User } from 'lucide-react'
import { getSlotSeatSummary, formatSlotTime } from '@/lib/seat-engine'

// Types
interface Student {
 id: string
 studentId: string
 name: string
 fatherName: string
}

interface Room {
 id: string
 name: string
 capacity: number
}

interface Slot {
 id: string
 roomId: string
 startTime: string
 endTime: string
 days: string
 room: Room
 courses?: Array<{
   enrollments: Enrollment[]
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

interface Enrollment {
  id: string
  studentId?: string
  courseOnSlotId?: string
  joiningDate?: Date | string
  status?: string
  endDate?: Date | string | null
  extendedDays?: number
}

export interface CourseOnSlot {
 id: string
 slotId: string
 courseId: string
 teacherId: string | null
 teacher: Teacher | null
 slot: Slot
 course: Course
 enrollments: Enrollment[]
}

interface EnrollmentFormProps {
 students: Student[]
 assignments: CourseOnSlot[]
}

export function EnrollmentForm({ students, assignments }: EnrollmentFormProps) {
 const router = useRouter()
 const [loading, setLoading] = useState(false)
 const [error, setError] = useState('')

 // Form State
 const [selectedStudent, setSelectedStudent] = useState('')
 const [selectedStudentData, setSelectedStudentData] = useState<Student | null>(null)
 const [selectedCourseId, setSelectedCourseId] = useState('')
 const [selectedAssignmentId, setSelectedAssignmentId] = useState('')
 const [selectedAssignmentData, setSelectedAssignmentData] = useState<CourseOnSlot | null>(null)
 
 // Search State
 const [studentSearch, setStudentSearch] = useState('')
 const [showStudentDropdown, setShowStudentDropdown] = useState(false)
 
 // Ref for click outside detection
 const dropdownRef = useRef<HTMLDivElement>(null)

 // Close dropdown when clicking outside
 useEffect(() => {
 const handleClickOutside = (event: MouseEvent) => {
 if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
 setShowStudentDropdown(false)
 }
 }

 document.addEventListener('mousedown', handleClickOutside)
 return () => document.removeEventListener('mousedown', handleClickOutside)
 }, [])

 // 1. Filter Logic: Extract unique courses from assignments
 const uniqueCourses = Array.from(new Set(assignments.map((a) => JSON.stringify(a.course))))
 .map((s) => JSON.parse(s) as Course)

 // 2. Filter Logic: When a course is selected, show available time slots
 const availableSlots = assignments.filter((a) => a.courseId === selectedCourseId)

 // 3. Search Logic: Filter students based on search query
 const filteredStudents = useMemo(() => {
 if (!studentSearch.trim()) return []
 
 const query = studentSearch.toLowerCase()
 return students.filter((student) => {
 const studentId = student.studentId?.toLowerCase() || ''
 const name = student.name?.toLowerCase() || ''
 const fatherName = student.fatherName?.toLowerCase() || ''
 
 return studentId.includes(query) || name.includes(query) || fatherName.includes(query)
 }).slice(0, 10)
 }, [studentSearch, students])

 const handleStudentSelect = (student: Student) => {
 if (!student.name || !student.fatherName) {
 setError('Invalid student data. Please contact support.')
 return
 }
 
 setSelectedStudent(student.id)
 setSelectedStudentData(student)
 setStudentSearch(`${student.studentId} - ${student.name} (s/o ${student.fatherName})`)
 setShowStudentDropdown(false)
 }

 const handleCourseChange = (courseId: string) => {
 setSelectedCourseId(courseId)
 setSelectedAssignmentId('')
 setSelectedAssignmentData(null)
 }

 const handleSlotChange = (assignmentId: string) => {
 setSelectedAssignmentId(assignmentId)
 const assignment = availableSlots.find((a) => a.id === assignmentId)
 setSelectedAssignmentData(assignment || null)
 }

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault()
 setLoading(true)
 setError('')

 try {
 await enrollStudent(selectedStudent, selectedAssignmentId)
 router.push('/admin/enrollment')
 } catch (err) {
 let errorMessage = 'An error occurred'
 if (err instanceof Error) {
 errorMessage = err.message
 } else if (typeof err === 'string') {
 errorMessage = err
 } else if (err && typeof err === 'object' && 'message' in err && typeof (err as any).message === 'string') {
 errorMessage = (err as any).message
 }

 if (
 errorMessage.includes('Room Capacity Exceeded') ||
 errorMessage.includes('Selected course slot is full') ||
 errorMessage.includes('slot is full')
 ) {
 errorMessage = 'Enrollment is full. Please choose another course slot.'
 }

 setError(errorMessage)
 } finally {
 setLoading(false)
 }
 }

 const isFormValid = selectedStudent && selectedCourseId && selectedAssignmentId

 const getTeacherLabel = (assignment: CourseOnSlot) => {
 if (!assignment.teacher) {
 return 'Teacher TBD'
 }

 const names = [assignment.teacher.firstName, assignment.teacher.lastName].filter(Boolean)
 return names.length > 0 ? names.join(' ') : 'Teacher TBD'
 }

 return (
 <form onSubmit={handleSubmit} className="space-y-6">
 {/* Error Alert */}
 {error && (
 <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-lg">
 <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-300 shrink-0 mt-0.5" />
 <div>
 <p className="font-medium text-red-900">Enrollment Failed</p>
 <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
 </div>
 </div>
 )}

 {/* Step 1: Student Selection */}
 <div className="rounded-[24px] border border-border/80 bg-card/90 p-6 shadow-[0_18px_50px_-24px_rgba(15,23,42,0.28)] transition-shadow hover:shadow-[0_18px_55px_-22px_rgba(15,23,42,0.34)]">
 <div className="flex items-start justify-between mb-4">
 <div>
 <div className="flex items-center gap-2">
 <div className={`flex items-center justify-center w-8 h-8 rounded-full font-medium text-sm ${selectedStudent ? 'bg-green-100 text-green-700 dark:text-green-300' : 'bg-blue-100 text-blue-700 dark:text-blue-300'}`}>
 {selectedStudent ? '✓' : '1'}
 </div>
 <h3 className="text-lg font-semibold text-foreground ">Select Student</h3>
 </div>
 <p className="text-sm text-muted-foreground mt-1">Search and choose a student to enroll</p>
 </div>
 </div>

 <div className="relative" ref={dropdownRef}>
 <div className="relative">
 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
 <input
 type="text"
 placeholder="Search by Student ID, Name, or Father's Name..."
 className="w-full rounded-2xl border border-border bg-card/90 py-3 pl-10 pr-4 text-sm text-foreground shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
 value={studentSearch}
 onChange={(e) => {
 setStudentSearch(e.target.value)
 setShowStudentDropdown(true)
 if (!e.target.value) {
 setSelectedStudent('')
 setSelectedStudentData(null)
 }
 }}
 onFocus={() => setShowStudentDropdown(true)}
 required
 />
 {selectedStudent && (
 <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 h-5 w-5" />
 )}
 </div>
 
 {/* Search Results Dropdown */}
 {showStudentDropdown && studentSearch && (
 <div className="absolute z-10 w-full mt-2 bg-card border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto">
 {filteredStudents.length > 0 ? (
 filteredStudents.map((student) => (
 <button
 key={student.id}
 type="button"
 className="w-full px-4 py-3 hover:bg-muted cursor-pointer border-b border-gray-100 dark:border-gray-800 last:border-b-0 text-left transition-colors"
 onClick={() => handleStudentSelect(student)}
 >
 <div className="font-medium text-foreground ">
 {student.studentId} • {student.name}
 </div>
 <div className="text-sm text-muted-foreground ">
 Father: {student.fatherName}
 </div>
 </button>
 ))
 ) : (
 <div className="px-4 py-3 text-muted-foreground text-sm text-center">
 No students found
 </div>
 )}
 </div>
 )}
 
 {/* Selected Student Card */}
 {selectedStudentData && (
 <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900/50 rounded-lg">
 <div className="flex items-start gap-3">
 <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-200 shrink-0 mt-0.5">
 <Check className="w-4 h-4 text-green-700 dark:text-green-300" />
 </div>
 <div>
 <div className="font-semibold text-green-900">
 {selectedStudentData.studentId} • {selectedStudentData.name}
 </div>
 <div className="text-sm text-green-700 dark:text-green-300">
 Father: {selectedStudentData.fatherName}
 </div>
 </div>
 </div>
 </div>
 )}
 
 <p className="text-xs text-muted-foreground mt-3">
 Don&apos;t see the student? <Link href="/admin/students/new" className="text-blue-600 dark:text-blue-300 font-medium hover:underline">Register them first</Link>.
 </p>
 </div>
 </div>

 {/* Step 2: Course Selection */}
 <div className={`rounded-[24px] border border-border/80 p-6 transition-all ${selectedStudent ? 'bg-card/90 shadow-[0_18px_50px_-24px_rgba(15,23,42,0.28)]' : 'bg-muted/80 opacity-70'}`}>
 <div className="flex items-start justify-between mb-4">
 <div>
 <div className="flex items-center gap-2">
 <div className={`flex items-center justify-center w-8 h-8 rounded-full font-medium text-sm ${selectedCourseId ? 'bg-green-100 text-green-700 dark:text-green-300' : 'bg-blue-100 text-blue-700 dark:text-blue-300'}`}>
 {selectedCourseId ? '✓' : '2'}
 </div>
 <h3 className="text-lg font-semibold text-foreground ">Select Course</h3>
 </div>
 <p className="text-sm text-muted-foreground mt-1">Choose a course to enroll in</p>
 </div>
 </div>

 <select 
 required
 disabled={!selectedStudent}
 className="w-full rounded-2xl border border-border bg-card/90 px-4 py-3 text-sm text-foreground shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-muted dark:disabled:bg-slate-800 disabled:text-muted-foreground dark:disabled:text-muted-foreground"
 value={selectedCourseId}
 onChange={(e) => handleCourseChange(e.target.value)}
 >
 <option value="">Select a course...</option>
 {uniqueCourses.map((c) => (
 <option key={c.id} value={c.id}>
 {c.name} • {c.durationMonths} months
 </option>
 ))}
 </select>

 {selectedCourseId && (
 <div className="mt-4 flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/40 rounded-lg">
 <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-300" />
 <span className="text-sm text-blue-700 dark:text-blue-300">
 {uniqueCourses.find((c) => c.id === selectedCourseId)?.name} • 
 {uniqueCourses.find((c) => c.id === selectedCourseId)?.durationMonths} months
 </span>
 </div>
 )}
 </div>

 {/* Step 3: Time Slot Selection */}
 <div className={`rounded-[24px] border border-border/80 p-6 transition-all ${selectedCourseId ? 'bg-card/90 shadow-[0_18px_50px_-24px_rgba(15,23,42,0.28)]' : 'bg-muted/80 opacity-70'}`}>
 <div className="flex items-start justify-between mb-4">
 <div>
 <div className="flex items-center gap-2">
 <div className={`flex items-center justify-center w-8 h-8 rounded-full font-medium text-sm ${selectedAssignmentId ? 'bg-green-100 text-green-700 dark:text-green-300' : 'bg-blue-100 text-blue-700 dark:text-blue-300'}`}>
 {selectedAssignmentId ? '✓' : '3'}
 </div>
 <h3 className="text-lg font-semibold text-foreground ">Choose Time Slot</h3>
 </div>
 <p className="text-sm text-muted-foreground mt-1">Select an available class slot</p>
 </div>
 </div>

 {!selectedCourseId ? (
    <p className="text-sm text-muted-foreground py-4">Select a course first to see available slots</p>
  ) : availableSlots.length > 0 ? (
    <div className="space-y-3">
      {availableSlots.map((a) => {
        // Collect all enrollments sharing this slot across all courses
        const allSlotEnrollments = a.slot.courses
          ? a.slot.courses.flatMap((c) => c.enrollments || [])
          : a.enrollments || []

        const seatInfo = getSlotSeatSummary(a.slot.room.capacity, allSlotEnrollments, {
          id: a.slot.id,
          roomName: a.slot.room.name,
          days: a.slot.days,
          startTime: a.slot.startTime,
          endTime: a.slot.endTime
        })

        const isFull = seatInfo.status === 'FULL'
        const isNearlyFull = seatInfo.status === 'ALMOST_FULL'
        const teacherLabel = getTeacherLabel(a)

        return (
          <label
            key={a.id}
            className={`flex cursor-pointer rounded-[20px] border-2 p-4 transition-all ${
              selectedAssignmentId === a.id
                ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-900/30'
                : isFull
                ? 'border-rose-200 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/10 opacity-80'
                : 'border-border bg-card hover:border-indigo-200 dark:hover:border-indigo-800'
            }`}
          >
            <input
              type="radio"
              name="slot"
              value={a.id}
              checked={selectedAssignmentId === a.id}
              onChange={() => handleSlotChange(a.id)}
              className="mt-1 cursor-pointer"
              disabled={isFull}
            />
            <div className="ml-3 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold text-foreground">{a.slot.days}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-foreground">{seatInfo.timeRangeFormatted || formatSlotTime(a.slot.startTime)}</span>
                </div>
                <div
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                    isFull
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                      : isNearlyFull
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                  }`}
                >
                  {isFull ? 'FULL' : `${seatInfo.availableSeats} Seats Free`}
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-indigo-500" />
                  <span className="font-medium text-foreground">{a.slot.room.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-sky-500" />
                  <span>{teacherLabel}</span>
                </div>
              </div>

              {/* Capacity Progress Bar */}
              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1">
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isFull
                          ? 'bg-rose-500'
                          : isNearlyFull
                          ? 'bg-amber-500'
                          : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                      }`}
                      style={{ width: `${seatInfo.occupancyPercent}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                  {seatInfo.totalEnrolled}/{seatInfo.roomCapacity} occupied
                </span>
              </div>

              {isFull && seatInfo.nextVacancyDate && (
                <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-400">
                  ⏳ Next seat opens on {new Date(seatInfo.nextVacancyDate).toLocaleDateString('en-US', { timeZone: 'Asia/Karachi', month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              )}
            </div>
          </label>
        )
      })}
    </div>
  ) : (
    <div className="p-4 bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-200 dark:border-yellow-900/50 rounded-lg">
      <p className="text-sm text-yellow-800 dark:text-yellow-300">No slots available for this course</p>
    </div>
  )}
 </div>

 {/* Summary Section */}
 {selectedAssignmentData && (
 <div className="rounded-[24px] border border-indigo-200 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50 to-slate-50 dark:from-indigo-950/30 dark:to-slate-900 p-6 shadow-sm">
 <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
 <Check className="w-5 h-5 text-green-600 dark:text-green-300" />
 Enrollment Summary
 </h3>
 
 <div className="space-y-3">
 <div className="flex items-center justify-between p-3 bg-card rounded-lg">
 <span className="text-sm font-medium text-muted-foreground ">Student</span>
 <span className="text-sm font-semibold text-foreground ">{selectedStudentData?.name}</span>
 </div>
 
 <div className="flex items-center justify-between p-3 bg-card rounded-lg">
 <span className="text-sm font-medium text-muted-foreground ">Course</span>
 <span className="text-sm font-semibold text-foreground ">{uniqueCourses.find((c) => c.id === selectedCourseId)?.name}</span>
 </div>
 
 <div className="flex items-center justify-between p-3 bg-card rounded-lg">
 <span className="text-sm font-medium text-muted-foreground ">Class Time</span>
 <span className="text-sm font-semibold text-foreground ">
 {selectedAssignmentData.slot.days} • {new Date(selectedAssignmentData.slot.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })}
 </span>
 </div>
 
 <div className="flex items-center justify-between p-3 bg-card rounded-lg">
 <span className="text-sm font-medium text-muted-foreground ">Teacher</span>
 <span className="text-sm font-semibold text-foreground ">{selectedAssignmentData.teacher ? getTeacherLabel(selectedAssignmentData) : 'TBD'}</span>
 </div>
 
 <div className="flex items-center justify-between p-3 bg-card rounded-lg">
 <span className="text-sm font-medium text-muted-foreground ">Location</span>
 <span className="text-sm font-semibold text-foreground ">{selectedAssignmentData.slot.room.name}</span>
 </div>
 </div>
 </div>
 )}

 {/* Submit Button */}
 <button 
 type="submit" 
 disabled={!isFormValid || loading}
 className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 font-semibold transition-all ${
 isFormValid && !loading
 ? 'cursor-pointer bg-slate-900 text-white hover:bg-slate-800 ' 
 : 'cursor-not-allowed bg-slate-300 text-white '
 }`}
 >
 {loading ? (
 <>
 <Loader2 className="w-5 h-5 animate-spin" />
 Processing Enrollment...
 </>
 ) : (
 <>
 Complete Enrollment
 <ArrowRight className="w-5 h-5" />
 </>
 )}
 </button>
 </form>
 )
}
