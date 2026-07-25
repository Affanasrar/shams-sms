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
  const [extendModal, setExtendModal] = useState<{ enrollmentId: string; studentName: string; courseName: string } | null>(null)
  const [additionalMonths, setAdditionalMonths] = useState(1)
  const [loading, setLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <GraduationCap className="text-indigo-600" size={28} />
            Course Completions
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage students who have completed their course duration
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
            {pendingEnrollments.length} Pending
          </span>
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            {completedEnrollments.length} Completed
          </span>
        </div>
      </div>

      {/* Status message */}
      {message && (
        <div className={`p-4 rounded-lg border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'pending' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
        >
          <div className="flex items-center gap-2">
            <Clock size={16} />
            Pending Action ({pendingEnrollments.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'completed' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            Completed ({completedEnrollments.length})
          </div>
        </button>
      </div>

      {/* Pending Tab */}
      {activeTab === 'pending' && (
        <div>
          {pendingEnrollments.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <GraduationCap size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No pending completions</p>
              <p className="text-sm">Students whose course duration has ended will appear here</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {pendingEnrollments.map((enrollment) => (
                <div key={enrollment.id} className="bg-white rounded-xl border border-amber-200 shadow-sm p-5 hover:shadow-md transition-shadow">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-bold text-sm">
                          {enrollment.student.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{enrollment.student.name}</h3>
                          <p className="text-sm text-gray-500">{enrollment.student.studentId} • S/o {enrollment.student.fatherName}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <GraduationCap size={14} /> {enrollment.courseOnSlot.course.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={14} /> {formatDate(enrollment.joiningDate)} → {formatDate(enrollment.endDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={14} /> {enrollment.courseOnSlot.slot.room.name} • {enrollment.courseOnSlot.slot.days}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} /> {formatTime(enrollment.courseOnSlot.slot.startTime)} - {formatTime(enrollment.courseOnSlot.slot.endTime)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-amber-700 text-sm">
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
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium flex items-center gap-2"
                      >
                        <RotateCcw size={14} />
                        Extend Course
                      </button>
                      <button
                        onClick={() => handleComplete(enrollment.id)}
                        disabled={loading === enrollment.id}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium flex items-center gap-2"
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
          {completedEnrollments.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <CheckCircle2 size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No completed enrollments yet</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Student</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Course</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Duration</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Completed On</th>
                  </tr>
                </thead>
                <tbody>
                  {completedEnrollments.map((enrollment) => (
                    <tr key={enrollment.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{enrollment.student.name}</div>
                        <div className="text-xs text-gray-500">{enrollment.student.studentId}</div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-gray-700">
                        {enrollment.courseOnSlot.course.name}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-gray-500">
                        {formatDate(enrollment.joiningDate)} → {formatDate(enrollment.endDate)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          <CheckCircle2 size={12} />
                          {formatDate(enrollment.completedAt)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Extend Modal */}
      {extendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Extend Course</h2>
            <p className="text-sm text-gray-600 mb-4">
              Extend <strong>{extendModal.studentName}</strong>&apos;s enrollment in <strong>{extendModal.courseName}</strong>. This will reactivate their enrollment and generate a new fee.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Months</label>
              <input
                type="number"
                min={1}
                max={12}
                value={additionalMonths}
                onChange={(e) => setAdditionalMonths(parseInt(e.target.value) || 1)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setExtendModal(null); setAdditionalMonths(1) }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleExtend}
                disabled={loading === extendModal.enrollmentId}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
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
