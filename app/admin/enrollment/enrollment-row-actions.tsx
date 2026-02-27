'use client'

import { useState } from 'react'
import { Clock, Trash2, X, AlertCircle, CheckCircle2 } from 'lucide-react'
import { dropStudent, changeEnrollmentTiming, restoreEnrollment } from '@/app/actions/enrollment'

type Props = {
  enrollmentId: string
  studentId: string
  studentName: string
  courseName: string
  status: string // ACTIVE | DROPPED | COMPLETED etc
  currentSlotId: string
  currentCourseOnSlotId: string
  currentTiming: {
    days: string
    startTime: Date
    endTime: Date
    room: string
  }
  availableSlotsForCourse: Array<{
    id: string
    days: string
    startTime: Date
    endTime: Date
    room: { name: string; capacity: number }
    enrollmentCount: number
  }>
}

type ActionState = {
  success: boolean
  message?: string
  error?: string
}

const initialState: ActionState = { success: false }

export function EnrollmentRowActions({
  enrollmentId,
  studentId,
  studentName,
  courseName,
  currentSlotId,
  currentCourseOnSlotId,
  currentTiming,
  availableSlotsForCourse
}: Props) {
  const [isTimingModalOpen, setIsTimingModalOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<string>('')
  const [state, setState] = useState<ActionState>(initialState)
  const [isLoading, setIsLoading] = useState(false)

  const isDropped = status === 'DROPPED'

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Karachi'
    })
  }

  const handleChangeSlot = async () => {
    if (!selectedSlot) return

    setIsLoading(true)
    try {
      const result = await changeEnrollmentTiming(enrollmentId, selectedSlot)
      setState(result)

      if (result.success) {
        setTimeout(() => {
          setIsTimingModalOpen(false)
          setSelectedSlot('')
          setState(initialState)
          // Refresh the page to show updated data
          window.location.reload()
        }, 2000)
      }
    } catch (error) {
      setState({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to change timing'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filter available slots to exclude current slot
  const otherAvailableSlots = availableSlotsForCourse.filter(
    slot => slot.id !== currentCourseOnSlotId
  )

  // If the enrollment was dropped, we don't allow timing changes
  if (isDropped) {
    // render early? we still want the markup above to show restore, so no changes here
  }

  return (
    <>
      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {!isDropped && (
          <button
            onClick={() => setIsTimingModalOpen(true)}
            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-white hover:bg-blue-600 px-3 py-1.5 rounded-md transition-all font-medium text-xs border border-transparent hover:border-blue-700"
            title="Change Course Timing"
          >
            <Clock size={14} /> Change Timing
          </button>
        )}

        {isDropped ? (
          <form
            action={async (formData) => {
              await restoreEnrollment(formData)
            }}
          >
            <input type="hidden" name="enrollmentId" value={enrollmentId} />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 text-green-600 hover:text-white hover:bg-green-600 px-3 py-1.5 rounded-md transition-all font-medium text-xs border border-transparent hover:border-green-700"
              title="Restore Enrollment"
            >
              <CheckCircle2 size={14} /> Restore
            </button>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              if (!confirm("Are you sure you want to drop this student? This action cannot be undone.")) {
                e.preventDefault()
              }
            }}
            action={async (formData) => {
              await dropStudent(formData)
            }}
          >
            <input type="hidden" name="enrollmentId" value={enrollmentId} />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 text-red-600 hover:text-white hover:bg-red-600 px-3 py-1.5 rounded-md transition-all font-medium text-xs border border-transparent hover:border-red-700"
              title="Drop Student from Class"
            >
              <Trash2 size={14} /> Drop
            </button>
          </form>
        )}
      </div>

      {/* Change Timing Modal */}
      {isTimingModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Change Course Timing</h2>
                <p className="text-gray-600">
                  Student: <span className="font-semibold">{studentName}</span>
                </p>
                <p className="text-gray-600">
                  Course: <span className="font-semibold">{courseName}</span>
                </p>
              </div>
              <button
                onClick={() => {
                  setIsTimingModalOpen(false)
                  setSelectedSlot('')
                  setState(initialState)
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Current Timing */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">Current Timing</h3>
              <div className="space-y-1 text-sm text-blue-800">
                <p>📅 Days: <span className="font-medium">{currentTiming.days}</span></p>
                <p>⏰ Time: <span className="font-medium">{formatTime(currentTiming.startTime)} - {formatTime(currentTiming.endTime)}</span></p>
                <p>📍 Room: <span className="font-medium">{currentTiming.room}</span></p>
              </div>
            </div>

            {/* Available Timings */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Select New Timing</h3>

              {otherAvailableSlots.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto mb-6">
                  {otherAvailableSlots.map((slot) => {
                    const availableSeats = slot.room.capacity - slot.enrollmentCount
                    const isFull = availableSeats <= 0

                    return (
                      <label
                        key={slot.id}
                        className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition ${
                          selectedSlot === slot.id
                            ? 'border-blue-500 bg-blue-50'
                            : isFull
                            ? 'border-red-200 bg-red-50 opacity-50 cursor-not-allowed'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="courseOnSlotId"
                          value={slot.id}
                          checked={selectedSlot === slot.id}
                          onChange={(e) => setSelectedSlot(e.target.value)}
                          disabled={isFull}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {slot.days}
                          </div>
                          <div className="text-sm text-gray-600">
                            ⏰ {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                          </div>
                          <div className="text-sm text-gray-600">
                            📍 {slot.room.name}
                          </div>
                          <div className={`text-xs font-medium mt-1 ${
                            isFull ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {isFull ? '❌ Full' : `✅ ${availableSeats} seats available`}
                          </div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-3 mb-6">
                  <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-medium text-yellow-900">No other timings available</p>
                    <p className="text-sm text-yellow-800">There are no alternative timings available for this course.</p>
                  </div>
                </div>
              )}

              {/* Messages */}
              {state.success && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3 mb-6">
                  <CheckCircle2 className="text-green-600 flex-shrink-0" size={20} />
                  <div>
                    <h4 className="font-semibold text-green-900">Success!</h4>
                    <p className="text-sm text-green-800">{state.message}</p>
                  </div>
                </div>
              )}

              {state.error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 mb-6">
                  <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                  <div>
                    <h4 className="font-semibold text-red-900">Error</h4>
                    <p className="text-sm text-red-800">{state.error}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={handleChangeSlot}
                disabled={!selectedSlot || isLoading || state.success || otherAvailableSlots.length === 0}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
              >
                {isLoading ? 'Updating...' : state.success ? 'Timing Changed!' : 'Change Timing'}
              </button>
              <button
                onClick={() => {
                  setIsTimingModalOpen(false)
                  setSelectedSlot('')
                  setState(initialState)
                }}
                disabled={isLoading}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 disabled:cursor-not-allowed transition font-medium"
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
