'use client'

import { useMemo, useState } from 'react'
import { useActionState } from 'react'
import { updateEnrollment } from '@/app/actions/enrollment'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { Clock3 } from 'lucide-react'

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
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="enrollmentId" value={enrollment.id} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Student</label>
                <p className="mt-2 text-lg font-semibold text-slate-900">{enrollment.studentName}</p>
                <p className="mt-1 text-sm text-slate-500">Enrollment ID: {enrollment.id}</p>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Enrollment Date</label>
                <input
                  type="date"
                  name="joiningDate"
                  value={joiningDate}
                  onChange={(event) => setJoiningDate(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
                  required
                />
                <p className="mt-2 text-xs text-slate-500">Changing this updates fee due dates for unpaid records.</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Current assignment</h3>
                <p className="text-sm text-slate-500">What the student is enrolled in right now.</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Editable</span>
            </div>

            <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Course</p>
                <p className="mt-1 font-semibold text-slate-900">{enrollment.currentCourseName}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Slot</p>
                <p className="mt-1 font-semibold text-slate-900">{enrollment.currentSlotLabel}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Room</p>
                <p className="mt-1 font-semibold text-slate-900">{enrollment.currentSlotRoom}</p>
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-slate-900">Search course</label>
              <div className="relative">
                <input
                  type="text"
                  value={courseSearch}
                  onChange={(event) => setCourseSearch(event.target.value)}
                  placeholder="Type course name to search"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
                />
                {courseSearch && (
                  <button
                    type="button"
                    onClick={() => setCourseSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-300"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
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
                        className={`rounded-3xl border p-4 text-left transition ${
                          isActiveCourse
                            ? 'border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <p className="font-semibold">{course.courseName}</p>
                        <p className={`mt-1 text-xs ${isActiveCourse ? 'text-white/70' : 'text-slate-500'}`}>
                          Click to view its available slots
                        </p>
                      </button>
                    )
                  })
                ) : (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500 md:col-span-2">
                    Search for a course to see available slots.
                  </div>
                )}
              </div>
            </div>

            {selectedCourseId && (
              <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4 md:p-5">
                <div className="mb-4">
                  <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Choose slot</h4>
                  <p className="mt-1 text-sm text-slate-500">Pick the specific room and timing for the selected course.</p>
                </div>
                <div className="grid gap-3">
                  {slotsForSelectedCourse.map((option) => {
                    const isSelected = selectedAssignmentId === option.id
                    return (
                      <label
                        key={option.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-3xl border p-4 transition ${
                          isSelected ? 'border-slate-900 bg-white shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="courseOnSlotId"
                          value={option.id}
                          checked={isSelected}
                          onChange={() => setSelectedAssignmentId(option.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-900">{option.courseName}</p>
                              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{option.slotLabel}</p>
                            </div>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                              {option.roomCapacity} seats
                            </span>
                          </div>
                          <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                            <div className="rounded-2xl bg-slate-50 px-3 py-2">
                              {format(new Date(option.slotStartTime), 'hh:mm a')} - {format(new Date(option.slotEndTime), 'hh:mm a')}
                            </div>
                            <div className="rounded-2xl bg-slate-50 px-3 py-2">Room: {option.roomName}</div>
                          </div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Server feedback</h4>
            <div className="mt-4 space-y-3">
              {!state.success && state.error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {state.error}
                </div>
              )}

              {state.success && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  {state.message || 'Enrollment updated successfully.'}
                </div>
              )}

              {!selectedAssignment && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  Choose a course and slot to preview the new assignment.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-slate-900 p-5 text-white shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-white/55">Preview</p>
            {selectedAssignment ? (
              <div className="mt-4 space-y-3">
                <p className="text-lg font-semibold">{selectedAssignment.courseName}</p>
                <div className="space-y-2 text-sm text-white/75">
                  <p>{selectedAssignment.slotLabel}</p>
                  <p>{format(new Date(selectedAssignment.slotStartTime), 'hh:mm a')} - {format(new Date(selectedAssignment.slotEndTime), 'hh:mm a')}</p>
                  <p>Room: {selectedAssignment.roomName}</p>
                  <p>Due date will align to the {previewNewDueDate}</p>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-white/70">Select a course and slot to see the new assignment preview.</p>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-100 p-2 text-slate-600">
                <Clock3 size={18} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Due date rule</p>
                <p className="font-semibold text-slate-900">Based on the joining day</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-500">
              The selected joining day is used to calculate unpaid fee due dates after the update.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3">
              <Button type="submit" disabled={isPending} className="rounded-2xl">
                {isPending ? 'Saving...' : 'Save Enrollment'}
              </Button>
              <p className="text-sm text-slate-500">Updated due dates are applied to unpaid and partial fees only.</p>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
