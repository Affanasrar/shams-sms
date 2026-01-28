// app/admin/attendance/[id]/attendance-viewer.tsx
'use client'

import { useState, useEffect } from 'react'
import { CalendarIcon, UserCheck, Edit, Save, X, AlertCircle, CheckCircle2, FileText, Download } from 'lucide-react'
import { updateAttendance } from '@/app/actions/attendance-admin'

type Enrollment = {
  id: string
  student: {
    id: string
    studentId: string
    name: string
    fatherName: string
  }
}

type AttendanceRecord = {
  id: string
  studentId: string
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE'
  markedBy: {
    firstName: string
    lastName: string
  }
}

type Props = {
  classId: string
  adminId: string
  enrollments: Enrollment[]
}

export function AttendanceViewer({ classId, adminId, enrollments }: Props) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [editStatus, setEditStatus] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [generatingReport, setGeneratingReport] = useState(false)

  // Fetch attendance for selected date
  const fetchAttendance = async (date: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/attendance?classId=${classId}&date=${date}`)
      if (response.ok) {
        const data = await response.json()
        setAttendance(data)
      }
    } catch (error) {
      console.error('Failed to fetch attendance:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchAttendance(selectedDate)
  }, [selectedDate])

  const handleEdit = (studentId: string, currentStatus: string) => {
    setEditing(studentId)
    setEditStatus({ [studentId]: currentStatus })
  }

  const handleCancel = () => {
    setEditing(null)
    setEditStatus({})
  }

  const handleSave = async (studentId: string) => {
    const newStatus = editStatus[studentId]
    if (!newStatus) return

    try {
      const result = await updateAttendance(classId, studentId, selectedDate, newStatus, adminId)
      if (result.success) {
        setMessage({ type: 'success', text: 'Attendance updated successfully!' })
        await fetchAttendance(selectedDate)
        setEditing(null)
        setEditStatus({})
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update attendance' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update attendance' })
    }
  }

  const generateMonthlyReport = async () => {
    setGeneratingReport(true)
    try {
      const reportDate = new Date(selectedDate)
      const month = reportDate.getMonth() + 1
      const year = reportDate.getFullYear()

      const response = await fetch(`/api/admin/attendance/reports?classId=${classId}&month=${month}&year=${year}`)
      if (response.ok) {
        const reportData = await response.json()

        // Generate PDF
        const pdfResponse = await fetch('/api/admin/reports/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'attendance',
            data: reportData,
            formatId: 'default' // You might want to get this from settings
          })
        })

        if (pdfResponse.ok) {
          const blob = await pdfResponse.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `attendance-report-${reportData.course.name}-${reportData.monthName}-${reportData.year}.pdf`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)

          setMessage({ type: 'success', text: 'Report generated successfully!' })
          setTimeout(() => setMessage(null), 3000)
        } else {
          setMessage({ type: 'error', text: 'Failed to generate PDF report' })
        }
      } else {
        setMessage({ type: 'error', text: 'Failed to fetch report data' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to generate report' })
    }
    setGeneratingReport(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'bg-green-100 text-green-800'
      case 'ABSENT': return 'bg-red-100 text-red-800'
      case 'LATE': return 'bg-yellow-100 text-yellow-800'
      case 'LEAVE': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      PRESENT: 'bg-green-100 text-green-800',
      ABSENT: 'bg-red-100 text-red-800',
      LATE: 'bg-yellow-100 text-yellow-800',
      LEAVE: 'bg-blue-100 text-blue-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CalendarIcon size={20} className="text-gray-600" />
              <label className="font-medium text-gray-700">Select Date:</label>
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {/* Indicator showing if today's attendance is marked */}
            {selectedDate === new Date().toISOString().split('T')[0] && attendance.length > 0 && (
              <div className="flex items-center gap-2 ml-4 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 size={16} className="text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  Today's Attendance Marked ({attendance.length}/{enrollments.length})
                </span>
              </div>
            )}
          </div>

          <button
            onClick={generateMonthlyReport}
            disabled={generatingReport}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {generatingReport ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Generating...
              </>
            ) : (
              <>
                <FileText size={16} />
                Generate Monthly Report
              </>
            )}
          </button>
        </div>

        <div className="text-sm text-gray-600">
          Showing attendance for {new Date(selectedDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'Asia/Karachi'
          })}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span className="font-medium">{message.text}</span>
          </div>
        </div>
      )}

      {/* Attendance Table */}
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Student Attendance</h3>
              <p className="text-sm text-gray-600 mt-1">
                {attendance.length} of {enrollments.length} students marked
              </p>
            </div>
            {attendance.length > 0 && selectedDate === new Date().toISOString().split('T')[0] && (
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <CheckCircle2 size={18} className="text-blue-600 animate-pulse" />
                <span className="text-sm font-semibold text-blue-700">Updated</span>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading attendance...</p>
          </div>
        ) : (
          <div className="divide-y">
            {enrollments.map((enrollment) => {
              const attendanceRecord = attendance.find(a => a.studentId === enrollment.student.id)

              return (
                <div key={enrollment.student.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                        {enrollment.student.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{enrollment.student.name}</p>
                        <p className="text-sm text-gray-500">
                          ID: {enrollment.student.studentId} • s/o {enrollment.student.fatherName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {editing === enrollment.student.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={editStatus[enrollment.student.id] || attendanceRecord?.status || 'PRESENT'}
                            onChange={(e) => setEditStatus({ [enrollment.student.id]: e.target.value })}
                            className="border rounded px-2 py-1 text-sm"
                          >
                            <option value="PRESENT">Present</option>
                            <option value="ABSENT">Absent</option>
                            <option value="LATE">Late</option>
                            <option value="LEAVE">Leave</option>
                          </select>
                          <button
                            onClick={() => handleSave(enrollment.student.id)}
                            className="bg-green-600 text-white px-2 py-1 rounded text-sm hover:bg-green-700"
                          >
                            <Save size={14} />
                          </button>
                          <button
                            onClick={handleCancel}
                            className="bg-gray-600 text-white px-2 py-1 rounded text-sm hover:bg-gray-700"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          {attendanceRecord ? (
                            <>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(attendanceRecord.status)}`}>
                                {attendanceRecord.status}
                              </span>
                              <span className="text-xs text-gray-500">
                                by {attendanceRecord.markedBy.firstName} {attendanceRecord.markedBy.lastName}
                              </span>
                              <button
                                onClick={() => handleEdit(enrollment.student.id, attendanceRecord.status)}
                                className="text-blue-600 hover:text-blue-800 p-1"
                                title="Edit attendance"
                              >
                                <Edit size={16} />
                              </button>
                            </>
                          ) : (
                            <span className="text-gray-400 text-sm italic">Not marked</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {enrollments.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No students enrolled in this class.
          </div>
        )}
      </div>
    </div>
  )
}