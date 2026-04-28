// app/admin/enrollment/new/enrollment-form.tsx
'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { enrollStudent } from '@/app/actions/enrollment'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Check, AlertCircle, Clock, MapPin, BookOpen, ArrowRight, Loader2 } from 'lucide-react'

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
}

interface Course {
  id: string
  name: string
  durationMonths: number
  baseFee: number
}

interface Enrollment {
  id: string
  studentId: string
  courseOnSlotId: string
  joiningDate: Date | string
  status: string
  endDate: Date | string | null
  extendedDays: number
}

export interface CourseOnSlot {
  id: string
  slotId: string
  courseId: string
  teacherId: string | null
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
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = selectedStudent && selectedCourseId && selectedAssignmentId

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Error Alert */}
      {error && (
        <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Enrollment Failed</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Step 1: Student Selection */}
      <div className="border rounded-lg p-6 bg-white hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-medium text-sm ${selectedStudent ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                {selectedStudent ? '✓' : '1'}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Select Student</h3>
            </div>
            <p className="text-sm text-gray-500 mt-1">Search and choose a student to enroll</p>
          </div>
        </div>

        <div className="relative" ref={dropdownRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by Student ID, Name, or Father's Name..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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
            <div className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <button
                    key={student.id}
                    type="button"
                    className="w-full px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 text-left transition-colors"
                    onClick={() => handleStudentSelect(student)}
                  >
                    <div className="font-medium text-gray-900">
                      {student.studentId} • {student.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      Father: {student.fatherName}
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-gray-500 text-sm text-center">
                  No students found
                </div>
              )}
            </div>
          )}
          
          {/* Selected Student Card */}
          {selectedStudentData && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-200 flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-green-700" />
                </div>
                <div>
                  <div className="font-semibold text-green-900">
                    {selectedStudentData.studentId} • {selectedStudentData.name}
                  </div>
                  <div className="text-sm text-green-700">
                    Father: {selectedStudentData.fatherName}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <p className="text-xs text-gray-500 mt-3">
            Don&apos;t see the student? <Link href="/admin/students/new" className="text-blue-600 font-medium hover:underline">Register them first</Link>.
          </p>
        </div>
      </div>

      {/* Step 2: Course Selection */}
      <div className={`border rounded-lg p-6 transition-all ${selectedStudent ? 'bg-white hover:shadow-md' : 'bg-gray-50 opacity-60'}`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-medium text-sm ${selectedCourseId ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                {selectedCourseId ? '✓' : '2'}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Select Course</h3>
            </div>
            <p className="text-sm text-gray-500 mt-1">Choose a course to enroll in</p>
          </div>
        </div>

        <select 
          required
          disabled={!selectedStudent}
          className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:text-gray-500 transition-colors"
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
          <div className="mt-4 flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-700">
              {uniqueCourses.find((c) => c.id === selectedCourseId)?.name} • 
              {uniqueCourses.find((c) => c.id === selectedCourseId)?.durationMonths} months
            </span>
          </div>
        )}
      </div>

      {/* Step 3: Time Slot Selection */}
      <div className={`border rounded-lg p-6 transition-all ${selectedCourseId ? 'bg-white hover:shadow-md' : 'bg-gray-50 opacity-60'}`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-medium text-sm ${selectedAssignmentId ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                {selectedAssignmentId ? '✓' : '3'}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Choose Time Slot</h3>
            </div>
            <p className="text-sm text-gray-500 mt-1">Select an available class slot</p>
          </div>
        </div>

        {!selectedCourseId ? (
          <p className="text-sm text-gray-500 py-4">Select a course first to see available slots</p>
        ) : availableSlots.length > 0 ? (
          <div className="space-y-3">
            {availableSlots.map((a) => {
              const startTime = new Date(a.slot.startTime).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit', 
                hour12: true, 
                timeZone: 'Asia/Karachi' 
              })
              
              const totalCapacity = a.slot.room.capacity
              const enrolledCount = a.enrollments?.length || 0
              const remainingCapacity = totalCapacity - enrolledCount
              const isFull = remainingCapacity === 0
              const isNearlyFull = remainingCapacity > 0 && remainingCapacity <= 2
              const capacityPercentage = (enrolledCount / totalCapacity) * 100
              
              return (
                <label key={a.id} className={`flex p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedAssignmentId === a.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
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
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-gray-600" />
                      <span className="font-semibold text-gray-900">{a.slot.days}</span>
                      <span className="text-gray-600">•</span>
                      <span className="text-gray-700">{startTime}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <MapPin className="w-4 h-4" />
                      <span>{a.slot.room.name}</span>
                    </div>
                    
                    {/* Capacity Bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              isFull ? 'bg-red-500' : isNearlyFull ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                          />
                        </div>
                      </div>
                      <span className={`text-sm font-medium whitespace-nowrap ${
                        isFull ? 'text-red-600' : isNearlyFull ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {remainingCapacity > 0 ? (
                          <>
                            {remainingCapacity} of {totalCapacity} available
                          </>
                        ) : (
                          <>
                            <span className="text-red-600">FULL</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </label>
              )
            })}
          </div>
        ) : (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">No slots available for this course</p>
          </div>
        )}
      </div>

      {/* Summary Section */}
      {selectedAssignmentData && (
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Check className="w-5 h-5 text-green-600" />
            Enrollment Summary
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <span className="text-sm font-medium text-gray-600">Student</span>
              <span className="text-sm font-semibold text-gray-900">{selectedStudentData?.name}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <span className="text-sm font-medium text-gray-600">Course</span>
              <span className="text-sm font-semibold text-gray-900">{uniqueCourses.find((c) => c.id === selectedCourseId)?.name}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <span className="text-sm font-medium text-gray-600">Class Time</span>
              <span className="text-sm font-semibold text-gray-900">
                {selectedAssignmentData.slot.days} • {new Date(selectedAssignmentData.slot.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <span className="text-sm font-medium text-gray-600">Location</span>
              <span className="text-sm font-semibold text-gray-900">{selectedAssignmentData.slot.room.name}</span>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button 
        type="submit" 
        disabled={!isFormValid || loading}
        className={`w-full py-3 px-4 rounded-lg font-semibold text-white flex items-center justify-center gap-2 transition-all ${
          isFormValid && !loading
            ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer' 
            : 'bg-gray-300 cursor-not-allowed'
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
