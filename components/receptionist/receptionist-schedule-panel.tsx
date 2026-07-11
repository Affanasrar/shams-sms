'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, Search, List, CalendarDays } from 'lucide-react'

export type ReceptionistTiming = {
  slotId: string
  days: string
  startTime: string
  endTime: string
  assignments: {
    id: string
    courseName: string
    enrolledCount: number
    students: Array<{ id: string; enrollmentId: string; name: string; fatherName: string; phone: string }>
  }[]
  totalEnrolled: number
  seatsLeft: number
}

export type ReceptionistRoomGroup = {
  roomName: string
  roomCapacity: number
  totalCapacity: number
  timings: ReceptionistTiming[]
  totalEnrolled: number
  totalCourses: number
  seatsLeft: number
}

interface ReceptionistSchedulePanelProps {
  roomGroups: ReceptionistRoomGroup[]
}

export function ReceptionistSchedulePanel({ roomGroups }: ReceptionistSchedulePanelProps) {
  const [query, setQuery] = useState('')
  const [activeQuery, setActiveQuery] = useState('')
  const [openRooms, setOpenRooms] = useState<string[]>([])
  const [openTimings, setOpenTimings] = useState<string[]>([])

  const filteredRooms = useMemo(() => {
    const term = activeQuery.trim().toLowerCase()
    if (!term) {
      return roomGroups
    }

    return roomGroups
      .map((room) => {
        const matchingTimings = room.timings.filter((timing) => {
          const timeLabel = `${new Date(timing.startTime).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Karachi'
          })} - ${new Date(timing.endTime).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Karachi'
          })}`.toLowerCase()

          return (
            room.roomName.toLowerCase().includes(term) ||
            timing.days.toLowerCase().includes(term) ||
            timeLabel.includes(term) ||
            timing.assignments.some((assignment) =>
              assignment.courseName.toLowerCase().includes(term) ||
              assignment.students.some((student) =>
                student.enrollmentId.toLowerCase().includes(term) ||
                student.name.toLowerCase().includes(term) ||
                student.fatherName.toLowerCase().includes(term)
              )
            )
          )
        })

        if (matchingTimings.length === 0) {
          return null
        }

        return { ...room, timings: matchingTimings }
      })
      .filter((room): room is ReceptionistRoomGroup => room !== null)
  }, [activeQuery, roomGroups])

  const toggleRoom = (roomName: string) => {
    setOpenRooms((prev) =>
      prev.includes(roomName) ? prev.filter((name) => name !== roomName) : [...prev, roomName]
    )
  }

  const toggleTiming = (slotId: string) => {
    setOpenTimings((prev) =>
      prev.includes(slotId) ? prev.filter((id) => id !== slotId) : [...prev, slotId]
    )
  }

  const handleSearch = () => {
    setActiveQuery(query)
  }

  const clearSearch = () => {
    setQuery('')
    setActiveQuery('')
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr_1fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">Search schedule</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Find rooms, timings, or students</h2>
          <p className="mt-2 text-sm text-slate-500">The schedule is grouped by room and expands only when you need the details.</p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    handleSearch()
                  }
                }}
                placeholder="Search room, time, course, or student"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm shadow-sm outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-2 focus:ring-cyan-100"
              />
            </label>
            <button
              type="button"
              onClick={handleSearch}
              className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Search
            </button>
          </div>

          {activeQuery && (
            <div className="mt-3 flex flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <span>Filtering by <strong className="text-slate-900">{activeQuery}</strong></span>
              <button type="button" onClick={clearSearch} className="font-semibold text-cyan-700 hover:text-cyan-800">
                Clear
              </button>
            </div>
          )}
        </div>

        <Link href="/receptionist/students" className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-lg">
          <div className="flex h-full flex-col justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">Admissions</p>
              <p className="mt-2 text-xl font-semibold text-slate-950">Student list</p>
              <p className="mt-2 text-sm text-slate-600">Jump back to the student directory for lookup and filtering.</p>
            </div>
            <List className="text-cyan-600" />
          </div>
        </Link>

        <Link href="/receptionist/enrollment" className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-lg">
          <div className="flex h-full flex-col justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">Enrollments</p>
              <p className="mt-2 text-xl font-semibold text-slate-950">Enrollment list</p>
              <p className="mt-2 text-sm text-slate-600">Review active placements by student, course, and room.</p>
            </div>
            <CalendarDays className="text-cyan-600" />
          </div>
        </Link>
      </div>

      <div className="space-y-4">
        {filteredRooms.length === 0 ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-slate-600 shadow-sm">
            No matching schedules found. Try a different room, time, course, or student.
          </div>
        ) : (
          filteredRooms.map((room) => {
            const roomOpen = openRooms.includes(room.roomName)
            const occupancyPercent = Math.round((room.totalEnrolled / room.roomCapacity) * 100)

            return (
              <article key={room.roomName} className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleRoom(room.roomName)}
                  className="flex w-full flex-col gap-4 border-b border-slate-100 bg-slate-50/80 px-6 py-5 text-left transition hover:bg-slate-50/95 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">Room summary</p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-950">{room.roomName}</h2>
                    <p className="mt-2 text-sm text-slate-600">
                      {room.timings.length} timing{room.timings.length !== 1 ? 's' : ''} · {room.totalCourses} course{room.totalCourses !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-3">
                    <SummaryBox label="Total enrolled" value={room.totalEnrolled} />
                    <SummaryBox label="Seats left" value={room.seatsLeft} />
                    <SummaryBox label="Total seats" value={room.totalCapacity} />
                  </div>
                </button>

                <div className="px-6 pt-5">
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-cyan-600" style={{ width: `${Math.min(occupancyPercent, 100)}%` }} />
                  </div>
                </div>

                <div className="p-6 pt-5">
                  <button
                    type="button"
                    onClick={() => toggleRoom(room.roomName)}
                    className="inline-flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-900 transition hover:border-cyan-200 hover:bg-cyan-50/60"
                  >
                    <span>{roomOpen ? 'Collapse room timings' : 'Expand room timings'}</span>
                    {roomOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>

                  {roomOpen && (
                    <div className="mt-4 space-y-4">
                      {room.timings.map((timing) => {
                        const timingOpen = openTimings.includes(timing.slotId)
                        const timeLabel = `${new Date(timing.startTime).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                          timeZone: 'Asia/Karachi'
                        })} - ${new Date(timing.endTime).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                          timeZone: 'Asia/Karachi'
                        })}`

                        return (
                          <div key={timing.slotId} className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-sm font-medium text-cyan-700">{timing.days}</p>
                                <h3 className="mt-1 text-lg font-semibold text-slate-950">{timeLabel}</h3>
                                <p className="mt-2 text-sm text-slate-600">
                                  {timing.assignments.length} course{timing.assignments.length !== 1 ? 's' : ''} · {timing.totalEnrolled} enrolled
                                </p>
                              </div>

                              <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-3">
                                <SummaryBox label="Seats left" value={timing.seatsLeft} />
                                <SummaryBox label="Enrolled" value={timing.totalEnrolled} />
                                <SummaryBox label="Courses" value={timing.assignments.length} />
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => toggleTiming(timing.slotId)}
                              className="mt-5 inline-flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-900 transition hover:border-cyan-200 hover:bg-cyan-50/60"
                            >
                              <span>{timingOpen ? 'Hide course details' : 'Show course details'}</span>
                              {timingOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>

                            {timingOpen && (
                              <div className="mt-4 space-y-4">
                                {timing.assignments.map((assignment) => (
                                  <div key={assignment.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                      <div>
                                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Course</p>
                                        <p className="mt-1 text-lg font-semibold text-slate-950">{assignment.courseName}</p>
                                      </div>
                                      <div className="rounded-2xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm">
                                        Enrolled: {assignment.enrolledCount}
                                      </div>
                                    </div>

                                    <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                                      {assignment.students.length === 0 ? (
                                        <p className="text-slate-500">No enrolled students yet.</p>
                                      ) : (
                                        <div className="space-y-3">
                                          {assignment.students.map((student) => (
                                            <div key={student.id} className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                                              <div>
                                                <p className="font-medium text-slate-950">{student.name}</p>
                                                <p className="text-xs text-slate-500">Father: {student.fatherName}</p>
                                              </div>
                                              <p className="text-xs text-slate-500">{student.phone}</p>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </article>
            )
          })
        )}
      </div>
    </div>
  )
}

function SummaryBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
      <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  )
}
