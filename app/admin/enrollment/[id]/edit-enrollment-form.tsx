'use client'

import { useMemo, useState } from 'react'
import { useActionState } from 'react'
import { updateEnrollment } from '@/app/actions/enrollment'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'

interface AssignmentOption {
  id: string
  courseId: string
  courseName: string
  slotLabel: string
  slotStartTime: string
  slotEndTime: string
  roomName: string
  roomCapacity: number
}

interface EnrollmentEditData {
  id: string
  studentId: string
  studentName: string
  currentCourseOnSlotId: string
  currentCourseName: string
  currentSlotLabel: string
  currentSlotTime: Date
  currentSlotRoom: string
  joiningDate: string
}

interface Props {
  enrollment: EnrollmentEditData
  assignments: AssignmentOption[]
}

type ActionState =
  | { success: true; message: string; error?: undefined }
  | { success: false; error: string; message?: undefined }

const initialState: ActionState = { success: false, error: '' }

export function EditEnrollmentForm({ enrollment, assignments }: Props) {
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(enrollment.currentCourseOnSlotId)
  const [joiningDate, setJoiningDate] = useState(enrollment.joiningDate)
  const [courseSearch, setCourseSearch] = useState('')
  const [selectedCourseId, setSelectedCourseId] = useState(
    assignments.find((item) => item.id === enrollment.currentCourseOnSlotId)?.courseId || ''
  )
  const [state, formAction, isPending] = useActionState(updateEnrollment, initialState)

  const selectedAssignment = useMemo(
    () => assignments.find((item) => item.id === selectedAssignmentId),
    [selectedAssignmentId, assignments]
  )

  const courses = useMemo(() => {
    const map = new Map<string, { courseId: string; courseName: string }>()
    for (const assignment of assignments) {
      if (!map.has(assignment.courseId)) {
        map.set(assignment.courseId, {
          courseId: assignment.courseId,
          courseName: assignment.courseName,
        })
      }
    }
    return Array.from(map.values())
  }, [assignments])

  const filteredCourses = useMemo(
    () => courses.filter((course) =>
      course.courseName.toLowerCase().includes(courseSearch.toLowerCase())
    ),
    [courses, courseSearch]
  )

  const slotsForSelectedCourse = useMemo(
    () => assignments.filter((assignment) => assignment.courseId === selectedCourseId),
    [assignments, selectedCourseId]
  )

  const computedDueDay = new Date(joiningDate).getDate()
  const previewNewDueDate = selectedAssignment ? `${computedDueDay} of each month` : ''

  return (
    <form action={formAction} className="space-y-6 bg-white border border-border rounded-2xl p-8 shadow-sm">
      <input type="hidden" name="enrollmentId" value={enrollment.id} />

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Student</label>
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            {enrollment.studentName}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Enrollment Date</label>
          <input
            type="date"
            name="joiningDate"
            value={joiningDate}
            onChange={(event) => setJoiningDate(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10"
            required
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Current Course / Slot</label>
            <p className="mt-1 text-sm text-gray-600">
              {enrollment.currentCourseName} • {enrollment.currentSlotLabel} • {format(new Date(enrollment.currentSlotTime), 'hh:mm a')} • {enrollment.currentSlotRoom}
            </p>
          </div>
          <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">Editable</div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Search Course</label>
          <input
            type="text"
            value={courseSearch}
            onChange={(event) => setCourseSearch(event.target.value)}
            placeholder="Type course name to search"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10"
          />

          <div className="mt-4 space-y-3">
            {filteredCourses.length > 0 ? (
              filteredCourses.map((course) => {
                const isActiveCourse = selectedCourseId === course.courseId
                return (
                  <button
                    key={course.courseId}
                    type="button"
                    onClick={() => {
                      setSelectedCourseId(course.courseId)
                      const firstSlot = assignments.find((assignment) => assignment.courseId === course.courseId)
                      if (firstSlot) setSelectedAssignmentId(firstSlot.id)
                    }}
                    className={`w-full text-left rounded-2xl border px-4 py-3 transition ${isActiveCourse ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                  >
                    <div className="font-medium text-gray-900">{course.courseName}</div>
                  </button>
                )
              })
            ) : (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                Search for a course to see available slots.
              </div>
            )}
          </div>

          {selectedCourseId && (
            <div className="mt-6 rounded-2xl border border-gray-200 p-4">
              <div className="text-sm font-semibold text-gray-900 mb-3">Choose Slot for Selected Course</div>
              <div className="space-y-3">
                {slotsForSelectedCourse.map((option) => {
                  const isSelected = selectedAssignmentId === option.id
                  return (
                    <label
                      key={option.id}
                      className={`flex items-center gap-3 rounded-2xl border p-3 transition ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input
                        type="radio"
                        name="courseOnSlotId"
                        value={option.id}
                        checked={isSelected}
                        onChange={() => setSelectedAssignmentId(option.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 text-sm">
                        <div className="font-medium text-gray-900">{option.slotLabel}</div>
                        <div className="text-gray-600">{format(new Date(option.slotStartTime), 'hh:mm a')} - {format(new Date(option.slotEndTime), 'hh:mm a')}</div>
                        <div className="text-gray-600">Room: {option.roomName}</div>
                        <div className="text-xs uppercase tracking-wide text-slate-500 mt-1">Capacity {option.roomCapacity}</div>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {selectedAssignment && (
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">New course/slot preview</p>
            <p>{selectedAssignment.courseName} • {selectedAssignment.slotLabel}</p>
            <p>{format(new Date(selectedAssignment.slotStartTime), 'hh:mm a')} - {format(new Date(selectedAssignment.slotEndTime), 'hh:mm a')}</p>
            <p>Due date will align to the {previewNewDueDate}</p>
          </div>
        )}
      </div>

      {!state.success && state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.error}
        </div>
      )}

      {state.success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {state.message || 'Enrollment updated successfully.'}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Enrollment'}
        </Button>
        <div className="text-sm text-muted-foreground">
          <p>Updated due dates are applied to unpaid and partial fees.</p>
        </div>
      </div>
    </form>
  )
}
