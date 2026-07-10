'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, ChevronsRight, Loader2, MessageSquare, Phone, Send, Sparkles } from 'lucide-react'

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
    fees?: Array<{
      id: string
      finalAmount: number
      dueDate: string
      cycleDate: string | null
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
  onSent?: () => void
}

type SmsResult = {
  studentId: string
  success: boolean
  message: string
}

export function SmsSender({ students, courseSlots, onSent }: Props) {
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [sending, setSending] = useState(false)
  const [results, setResults] = useState<SmsResult[]>([])
  const [customMessage, setCustomMessage] = useState('')
  const [selectedCourse, setSelectedCourse] = useState<string>('')
  const [selectedCourseSlot, setSelectedCourseSlot] = useState<string>('')
  const [feedback, setFeedback] = useState<string | null>(null)

  const uniqueCourses = useMemo(
    () =>
      Array.from(new Map(courseSlots.map(slot => [slot.course.id, slot.course])).values()).sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
    [courseSlots]
  )

  const filteredCourseSlots = useMemo(
    () => (selectedCourse ? courseSlots.filter(slot => slot.course.id === selectedCourse) : []),
    [courseSlots, selectedCourse]
  )

  const filteredStudents = useMemo(
    () =>
      students.filter(student => {
        if (!selectedCourseSlot) {
          if (!selectedCourse) return true
          return student.enrollments.some(enrollment => enrollment.courseOnSlot.course.id === selectedCourse)
        }

        return student.enrollments.some(enrollment => enrollment.courseOnSlot.id === selectedCourseSlot)
      }),
    [selectedCourse, selectedCourseSlot, students]
  )

  useEffect(() => {
    const visibleStudentIds = filteredStudents.map(student => student.id)
    setSelectedStudents(prev => prev.filter(id => visibleStudentIds.includes(id)))
  }, [filteredStudents])

  const selectedCount = selectedStudents.length
  const visibleCount = filteredStudents.length
  const hasStudents = visibleCount > 0

  const allVisibleSelected = hasStudents && selectedCount === visibleCount && filteredStudents.every(student => selectedStudents.includes(student.id))

  const handleSelectAll = () => {
    const filteredStudentIds = filteredStudents.map(student => student.id)

    if (allVisibleSelected) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(filteredStudentIds)
    }
  }

  const handleCourseChange = (courseId: string) => {
    setSelectedCourse(courseId)
    setSelectedCourseSlot('')
    setSelectedStudents([])
    setResults([])
    setFeedback(null)
  }

  const handleCourseSlotChange = (slotId: string) => {
    setSelectedCourseSlot(slotId)
    setSelectedStudents([])
    setResults([])
    setFeedback(null)
  }

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
    setFeedback(null)
  }

  const handleSendSms = async () => {
    if (selectedStudents.length === 0) {
      setFeedback('Select at least one student before sending.')
      return
    }

    if (!customMessage.trim()) {
      setFeedback('Enter a custom message before sending.')
      return
    }

    setSending(true)
    setResults([])
    setFeedback(null)

    try {
      const response = await fetch('/api/admin/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentIds: selectedStudents,
          customMessage: customMessage.trim()
        })
      })

      const data = await response.json().catch(() => ({ error: 'Unknown error' }))

      if (response.ok) {
        const nextResults = Array.isArray(data.results) ? data.results : []
        setResults(nextResults)
        setFeedback(`Sent ${nextResults.filter((result: SmsResult) => result.success).length} message${nextResults.filter((result: SmsResult) => result.success).length === 1 ? '' : 's'} successfully.`)
        onSent?.()
      } else {
        setFeedback(data.error || 'Failed to send SMS.')
      }
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Failed to send SMS. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const formatTimeRange = (slot: CourseSlot) => {
    const startTime = new Date(slot.slot.startTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
    const endTime = new Date(slot.slot.endTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })

    return `${startTime} - ${endTime}`
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-[linear-gradient(135deg,#eff6ff_0%,#f8fafc_48%,#ffffff_100%)] p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
              <Sparkles size={12} />
              Bulk SMS sender
            </div>
            <div>
              <h3 className="text-2xl font-semibold tracking-tight text-slate-950">Compose a message, filter the audience, and send in one pass.</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Use <span className="font-semibold text-slate-900">[Student Name]</span> and <span className="font-semibold text-slate-900">[Student ID]</span> to personalize the message for every recipient.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 md:min-w-88">
            <MetricChip label="Visible" value={visibleCount} />
            <MetricChip label="Selected" value={selectedCount} />
            <MetricChip label="Sent" value={results.filter(result => result.success).length} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-base font-semibold text-slate-900">Message preview</h4>
                <p className="text-sm text-slate-500">What you type here is sent to every selected student.</p>
              </div>
              <div className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 md:inline-flex">
                {customMessage.trim().length} characters
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <textarea
                value={customMessage}
                onChange={e => {
                  setCustomMessage(e.target.value)
                  setFeedback(null)
                }}
                placeholder="Enter your custom message. Example: Hello [Student Name], your Student ID is [Student ID]."
                className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
                rows={4}
              />
              <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                <span className="rounded-full bg-slate-100 px-3 py-1">[Student Name]</span>
                <span className="rounded-full bg-slate-100 px-3 py-1">[Student ID]</span>
                <span className="rounded-full bg-slate-100 px-3 py-1">Personalized automatically</span>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-base font-semibold text-slate-900">Audience filters</h4>
                <p className="text-sm text-slate-500">Filter by course first, then narrow by timing if needed.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCourse('')
                  setSelectedCourseSlot('')
                  setSelectedStudents([])
                  setResults([])
                  setFeedback(null)
                }}
                className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
              >
                Clear filters
              </button>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Select course</label>
                <select
                  value={selectedCourse}
                  onChange={e => handleCourseChange(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                >
                  <option value="">All courses</option>
                  {uniqueCourses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Select time slot</label>
                <select
                  value={selectedCourseSlot}
                  onChange={e => handleCourseSlotChange(e.target.value)}
                  disabled={!selectedCourse}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">{selectedCourse ? 'All slots for this course' : 'Choose a course first'}</option>
                  {filteredCourseSlots.map(courseSlot => (
                    <option key={courseSlot.id} value={courseSlot.id}>
                      {formatTimeRange(courseSlot)} • {courseSlot.slot.days} • {courseSlot.slot.room.name}
                      {courseSlot.teacher ? ` • ${[courseSlot.teacher.firstName, courseSlot.teacher.lastName].filter(Boolean).join(' ')}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4">
              <div>
                <h4 className="text-base font-semibold text-slate-900">Students</h4>
                <p className="text-sm text-slate-500">Select who should receive the message.</p>
              </div>
              <button type="button" onClick={handleSelectAll} className="text-sm font-semibold text-sky-700 transition hover:text-sky-900">
                {allVisibleSelected ? 'Deselect all' : 'Select all'}
              </button>
            </div>

            <div className="max-h-112 overflow-y-auto">
              {filteredStudents.length === 0 ? (
                <EmptyStudentsState selectedCourse={selectedCourse} selectedCourseSlot={selectedCourseSlot} />
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredStudents.map(student => {
                    const recentFee = student.enrollments
                      .flatMap(enrollment => enrollment.fees ?? [])
                      .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())[0]

                    const totalOutstanding = student.enrollments
                      .flatMap(enrollment => enrollment.fees ?? [])
                      .reduce((sum, fee) => sum + Number(fee.finalAmount), 0)

                    const selected = selectedStudents.includes(student.id)

                    return (
                      <label
                        key={student.id}
                        className={`flex cursor-pointer items-start gap-4 px-5 py-4 transition ${selected ? 'bg-sky-50/80' : 'hover:bg-slate-50'}`}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => handleStudentToggle(student.id)}
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                        />

                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate font-semibold text-slate-900">
                                {student.studentId} • {student.name}
                              </div>
                              <div className="truncate text-sm text-slate-500">s/o {student.fatherName}</div>
                            </div>
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                              <Phone size={11} />
                              {student.phone || 'No phone'}
                            </span>
                          </div>

                          {recentFee ? (
                            <div className="flex flex-wrap gap-2 text-xs">
                              <span className="rounded-full bg-rose-50 px-2.5 py-1 font-medium text-rose-700">
                                Due {new Date(recentFee.dueDate).toLocaleDateString()}
                              </span>
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                                PKR {Number(recentFee.finalAmount).toLocaleString()}
                              </span>
                              {totalOutstanding > Number(recentFee.finalAmount) && (
                                <span className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700">
                                  Total PKR {totalOutstanding.toLocaleString()}
                                </span>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500">No outstanding fee data attached to this student.</p>
                          )}
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 text-sm text-slate-600">
              {selectedCount} of {visibleCount} students selected
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-slate-100 p-2 text-slate-700">
                <ChevronsRight size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-base font-semibold text-slate-900">Send action</h4>
                <p className="text-sm text-slate-500">Review the selection, then send the message to every checked student.</p>
              </div>
            </div>

            {feedback && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                {feedback}
              </div>
            )}

            <button
              type="button"
              onClick={() => void handleSendSms()}
              disabled={sending || selectedStudents.length === 0 || !customMessage.trim()}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {sending ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Sending SMS...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Send SMS ({selectedCount})
                </>
              )}
            </button>
          </section>
        </aside>
      </div>

      {results.length > 0 && (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="text-base font-semibold text-slate-900">Send results</h4>
              <p className="text-sm text-slate-500">A quick breakdown of the most recent bulk send.</p>
            </div>
            <div className="text-sm text-slate-500">
              {results.filter(result => result.success).length} successful, {results.filter(result => !result.success).length} failed
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {results.map(result => {
              const student = students.find(current => current.id === result.studentId)

              return (
                <div
                  key={result.studentId}
                  className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${
                    result.success ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'
                  }`}
                >
                  {result.success ? <CheckCircle2 size={18} className="mt-0.5 text-emerald-600" /> : <AlertCircle size={18} className="mt-0.5 text-rose-600" />}
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-900">
                      {student?.studentId || 'Unknown student'} • {student?.name || 'No name available'}
                    </div>
                    <div className="text-sm text-slate-600">{result.message}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

function MetricChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 p-3 text-center shadow-sm backdrop-blur">
      <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-950">{value}</div>
    </div>
  )
}

function EmptyStudentsState({ selectedCourse, selectedCourseSlot }: { selectedCourse: string; selectedCourseSlot: string }) {
  const title = !selectedCourse
    ? 'Choose a course to narrow the audience'
    : !selectedCourseSlot
      ? 'No students found for this course'
      : 'No students found for this timing'

  const description = !selectedCourse
    ? 'Use the course selector above to start filtering students for a bulk SMS.'
    : !selectedCourseSlot
      ? 'Try another course or clear the filter to show every active student.'
      : 'Try a different slot or clear the slot filter to broaden the selection.'

  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      <div className="rounded-full bg-slate-100 p-3 text-slate-600">
        <MessageSquare size={20} />
      </div>
      <div>
        <h5 className="text-base font-semibold text-slate-900">{title}</h5>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
    </div>
  )
}