'use client'

import { useState } from 'react'
import { RotateCcw, Clock, X, AlertCircle } from 'lucide-react'
import { reEnrollStudent, extendDroppedStudent } from '@/app/actions/dropped-students'

type Props = {
  enrollmentId: string
  studentId: string
  studentName: string
  courseName: string
  droppedDate: Date
  dropReason: 'duration' | 'admin'
}

type ActionState = {
  success: boolean
  message?: string
  error?: string
}

const initialState: ActionState = { success: false }

export function DroppedStudentRowActions({
  enrollmentId,
  studentId,
  studentName,
  courseName,
  droppedDate,
  dropReason,
}: Props) {
  const [isReEnrollModalOpen, setIsReEnrollModalOpen] = useState(false)
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false)
  const [extendDays, setExtendDays] = useState<number>(30)
  const [state, setState] = useState<ActionState>(initialState)
  const [isLoading, setIsLoading] = useState(false)

  const handleReEnroll = async (extendDays?: number) => {
    setIsLoading(true)
    try {
      const result = await reEnrollStudent(enrollmentId, { extendDays })
      setState({ success: true, message: 'Student re-enrolled successfully!' })

      setTimeout(() => {
        setIsReEnrollModalOpen(false)
        setState(initialState)
        window.location.reload()
      }, 2000)
    } catch (error) {
      setState({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to re-enroll student',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExtend = async () => {
    if (!extendDays || extendDays <= 0) {
      setState({
        success: false,
        error: 'Please enter a valid number of days',
      })
      return
    }

    setIsLoading(true)
    try {
      const result = await extendDroppedStudent(enrollmentId, extendDays)
      setState({ success: true, message: `Enrollment extended by ${extendDays} days` })

      setTimeout(() => {
        setIsExtendModalOpen(false)
        setExtendDays(30)
        setState(initialState)
        window.location.reload()
      }, 2000)
    } catch (error) {
      setState({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to extend enrollment',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            setIsReEnrollModalOpen(true)
            setState(initialState)
          }}
          className="inline-flex items-center gap-1.5 text-green-600 hover:text-white hover:bg-green-600 px-3 py-1.5 rounded-md transition-all font-medium text-xs border border-transparent hover:border-green-700"
          title="Re-enroll Student"
        >
          <RotateCcw size={14} /> Re-enroll
        </button>

        <button
          onClick={() => {
            setIsExtendModalOpen(true)
            setState(initialState)
          }}
          className="inline-flex items-center gap-1.5 text-blue-600 hover:text-white hover:bg-blue-600 px-3 py-1.5 rounded-md transition-all font-medium text-xs border border-transparent hover:border-blue-700"
          title="Extend Duration"
        >
          <Clock size={14} /> Extend
        </button>
      </div>

      {/* Re-enroll Modal */}
      {isReEnrollModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold">Re-enroll Student</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Bring back {studentName}
                </p>
              </div>
              <button
                onClick={() => setIsReEnrollModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Dropped Information */}
            <div className={`rounded-lg p-4 mb-6 border ${dropReason === 'duration' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex gap-3">
                <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${dropReason === 'duration' ? 'text-yellow-600' : 'text-red-600'}`} />
                <div className="text-sm">
                  <p className={`font-medium ${dropReason === 'duration' ? 'text-yellow-900' : 'text-red-900'}`}>
                    {dropReason === 'duration' ? '📅 Dropped Due to Course Duration' : '🚫 Manually Dropped by Admin'}
                  </p>
                  <p className={`mt-1 ${dropReason === 'duration' ? 'text-yellow-700' : 'text-red-700'}`}>
                    {dropReason === 'duration' 
                      ? 'This student completed their course duration. Re-enrolling will give them a fresh start with new fees.'
                      : 'This student was manually dropped by an administrator. Re-enrolling will restore them to active status.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Enrollment Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-xs text-gray-600 mb-2">ENROLLMENT DETAILS</p>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-600">Student:</span>{' '}
                  <span className="font-medium">{studentName}</span>
                </p>
                <p>
                  <span className="text-gray-600">Course:</span>{' '}
                  <span className="font-medium">{courseName}</span>
                </p>
              </div>
            </div>

            {/* Status Messages */}
            {state.error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {state.error}
              </div>
            )}

            {state.success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {state.message}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => handleReEnroll()}
                disabled={isLoading}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition font-medium text-sm"
              >
                {isLoading ? 'Re-enrolling...' : 'Yes, Re-enroll'}
              </button>
              <button
                type="button"
                onClick={() => setIsReEnrollModalOpen(false)}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extend Duration Modal */}
      {isExtendModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold">Extend Duration</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Consider extending {studentName}'s enrollment period
                </p>
              </div>
              <button
                onClick={() => setIsExtendModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-900">
                Extend the enrollment period without re-enrolling. This just updates the end date for reference.
              </p>
            </div>

            {/* Days Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Days to Extend
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={extendDays}
                onChange={(e) => setExtendDays(parseInt(e.target.value) || 0)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter number of days"
              />
              <p className="text-xs text-gray-500 mt-1">
                Default is 30 days (1 month)
              </p>
            </div>

            {/* Status Messages */}
            {state.error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {state.error}
              </div>
            )}

            {state.success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {state.message}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleExtend}
                disabled={isLoading || !extendDays}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-medium text-sm"
              >
                {isLoading ? 'Extending...' : 'Extend Duration'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsExtendModalOpen(false)
                  setExtendDays(30)
                  setState(initialState)
                }}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
