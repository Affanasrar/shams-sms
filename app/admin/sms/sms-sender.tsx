// app/admin/sms/sms-sender.tsx
'use client'

import { useState } from 'react'
import { Send, Loader, CheckCircle, AlertCircle, Phone } from 'lucide-react'

type Student = {
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
    fees: Array<{
      id: string
      finalAmount: number
      dueDate: string
      cycleDate: string
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

type Props = {
  students: Student[]
  courseSlots: CourseSlot[]
}

type SmsResult = {
  studentId: string
  success: boolean
  message: string
}

export function SmsSender({ students, courseSlots }: Props) {
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [sending, setSending] = useState(false)
  const [results, setResults] = useState<SmsResult[]>([])
  const [customMessage, setCustomMessage] = useState('')
  const [selectedCourse, setSelectedCourse] = useState<string>('')
  const [selectedCourseSlot, setSelectedCourseSlot] = useState<string>('')

  const handleSelectAll = () => {
    const filteredStudents = students.filter(student => {
      if (!selectedCourseSlot) return true
      return student.enrollments.some(enrollment => enrollment.courseOnSlot.id === selectedCourseSlot)
    })

    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id))
    }
  }

  const handleCourseChange = (courseId: string) => {
    setSelectedCourse(courseId)
    setSelectedCourseSlot('') // Reset course slot selection when course changes
    setSelectedStudents([]) // Clear student selection
  }

  // Get unique courses from courseSlots
  const uniqueCourses = Array.from(
    new Map(
      courseSlots.map(slot => [slot.course.id, slot.course])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name))

  // Filter course slots based on selected course
  const filteredCourseSlots = selectedCourse
    ? courseSlots.filter(slot => slot.course.id === selectedCourse)
    : []

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

  const handleSendSms = async () => {
    if (selectedStudents.length === 0) {
      alert('Please select at least one student')
      return
    }

    if (!customMessage.trim()) {
      alert('Please enter a custom message')
      return
    }

    setSending(true)
    setResults([])

    try {
      const response = await fetch('/api/admin/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentIds: selectedStudents,
          customMessage: customMessage,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setResults(data.results)
      } else {
        alert(`Failed to send SMS: ${data.error}`)
      }
    } catch (error) {
      console.error('Error sending SMS:', error)
      alert('Failed to send SMS. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="space-y-6">
        {/* Message Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Custom Message</h3>
          <p className="text-sm text-blue-800 bg-white p-2 rounded border font-mono">
            {customMessage || 'Enter your custom message...'}
          </p>
          <p className="text-xs text-blue-600 mt-2">
            Available placeholders: [Student Name], [Student ID]
          </p>
        </div>

        {/* Custom Message Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Custom Message</label>
          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Enter your custom message. Use [Student Name] and [Student ID] as placeholders."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
          />
          <p className="text-xs text-gray-500 mt-1">
            Available placeholders: [Student Name], [Student ID]
          </p>
        </div>

        {/* Course Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Course</label>
          <select
            value={selectedCourse}
            onChange={(e) => handleCourseChange(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a course...</option>
            {uniqueCourses.map(course => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>

        {/* Course Slot Selection */}
        {selectedCourse && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Time Slot & Teacher</label>
            <select
              value={selectedCourseSlot}
              onChange={(e) => setSelectedCourseSlot(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All slots for this course</option>
              {filteredCourseSlots.map(courseSlot => {
                const startTime = new Date(courseSlot.slot.startTime).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })
                const endTime = new Date(courseSlot.slot.endTime).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })
                const displayText = `${startTime}-${endTime} (${courseSlot.slot.days}) - ${courseSlot.slot.room.name}${courseSlot.teacher ? ` - ${courseSlot.teacher.firstName || ''} ${courseSlot.teacher.lastName || ''}`.trim() : ''}`
                return (
                  <option key={courseSlot.id} value={courseSlot.id}>
                    {displayText}
                  </option>
                )
              })}
            </select>
          </div>
        )}

        {/* Student Selection */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">Select Students</label>
            <button
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {selectedStudents.length === students.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="border border-gray-200 rounded-xl max-h-64 overflow-y-auto">
            {students
              .filter(student => {
                if (!selectedCourseSlot) {
                  // If no specific slot selected, show students from all slots of the selected course
                  if (!selectedCourse) return true
                  return student.enrollments.some(enrollment =>
                    enrollment.courseOnSlot.course.id === selectedCourse
                  )
                }
                // If specific slot selected, filter by that slot
                return student.enrollments.some(enrollment => enrollment.courseOnSlot.id === selectedCourseSlot)
              })
              .map(student => {
              const recentFee = student.enrollments
                .flatMap(enrollment => enrollment.fees)
                .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())[0]

              const totalOutstanding = student.enrollments
                .flatMap(enrollment => enrollment.fees)
                .reduce((sum, fee) => sum + fee.finalAmount, 0)

              return (
                <div
                  key={student.id}
                  className="flex items-center p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student.id)}
                    onChange={() => handleStudentToggle(student.id)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {student.studentId} - {student.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      s/o {student.fatherName}
                    </div>
                    {recentFee && (
                      <div className="text-sm text-red-600 font-medium">
                        Due: {new Date(recentFee.dueDate).toLocaleDateString()} - PKR {recentFee.finalAmount}
                        {totalOutstanding > recentFee.finalAmount && (
                          <span className="text-orange-600"> (Total: PKR {totalOutstanding})</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Phone size={14} className="mr-1" />
                    {student.phone || 'No phone'}
                  </div>
                </div>
              )
            })}
          </div>

          <p className="text-sm text-gray-600 mt-2">
            {selectedStudents.length} of {students.filter(student => {
              if (!selectedCourseSlot) {
                // If no specific slot selected, show students from all slots of the selected course
                if (!selectedCourse) return true
                return student.enrollments.some(enrollment =>
                  enrollment.courseOnSlot.course.id === selectedCourse
                )
              }
              // If specific slot selected, filter by that slot
              return student.enrollments.some(enrollment => enrollment.courseOnSlot.id === selectedCourseSlot)
            }).length} students selected
          </p>
        </div>

        {/* Send Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSendSms}
            disabled={sending || selectedStudents.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {sending ? (
              <>
                <Loader size={18} className="animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send size={18} />
                Send SMS ({selectedStudents.length})
              </>
            )}
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Send Results</h3>
            <div className="space-y-2">
              {results.map((result, index) => {
                const student = students.find(s => s.id === result.studentId)
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    {result.success ? (
                      <CheckCircle size={18} className="text-green-600" />
                    ) : (
                      <AlertCircle size={18} className="text-red-600" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {student?.studentId} - {student?.name}
                      </div>
                      <div className="text-sm text-gray-600">{result.message}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}