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
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-500 mb-2">Search schedule</p>
          <div className="flex flex-col gap-3 sm:flex-row">
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
                className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-sm shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-100"
              />
            </label>
            <button
              type="button"
              onClick={handleSearch}
              className="rounded-xl bg-cyan-600 px-4 py-3 text-white transition hover:bg-cyan-700"
            >
              Search
            </button>
          </div>
          {activeQuery && (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm text-slate-500">
              <span>Filtering by: <strong>{activeQuery}</strong></span>
              <button type="button" onClick={clearSearch} className="font-semibold text-cyan-600 hover:text-cyan-700">
                Clear
              </button>
            </div>
          )}
        </div>

        <Link href="/receptionist/students" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-cyan-300">
          <div className="flex h-full flex-col justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">Admissions</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">Student list</p>
            </div>
            <List className="text-cyan-600" />
          </div>
        </Link>

        <Link href="/receptionist/enrollment" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-cyan-300">
          <div className="flex h-full flex-col justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">Enrollments</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">Enrollment list</p>
            </div>
            <CalendarDays className="text-cyan-600" />
          </div>
        </Link>
      </div>

      <div className="grid gap-4">
        {filteredRooms.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-600 shadow-sm">
            No matching schedules found. Try a different room, time, course, or student.
          </div>
        ) : (
          filteredRooms.map((room) => {
            const roomOpen = openRooms.includes(room.roomName)
            const occupancyPercent = Math.round((room.totalEnrolled / room.roomCapacity) * 100)

            return (
              <article key={room.roomName} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleRoom(room.roomName)}
                  className="flex flex-col gap-4 text-left sm:flex-row sm:items-center sm:justify-between w-full"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-500">Room summary</p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-900">{room.roomName}</h2>
                    <p className="mt-2 text-sm text-slate-600">
                      {room.timings.length} timing{room.timings.length !== 1 ? 's' : ''} · {room.totalCourses} course{room.totalCourses !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 p-4 text-center">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total enrolled</p>
                      <p className="mt-2 text-xl font-semibold text-slate-900">{room.totalEnrolled}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4 text-center">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Seats left</p>
                      <p className="mt-2 text-xl font-semibold text-slate-900">{room.seatsLeft}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4 text-center">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Capacity</p>
                      <p className="mt-2 text-xl font-semibold text-slate-900">{room.roomCapacity}</p>
                    </div>
                  </div>
                </button>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-cyan-600" style={{ width: `${Math.min(occupancyPercent, 100)}%` }} />
                </div>

                <button
                  type="button"
                  onClick={() => toggleRoom(room.roomName)}
                  className="mt-6 inline-flex items-center justify-between w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
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
                        <div key={timing.slotId} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-sm text-slate-500">{timing.days}</p>
                              <h3 className="mt-1 text-lg font-semibold text-slate-900">{timeLabel}</h3>
                              <p className="mt-2 text-sm text-slate-600">
                                {timing.assignments.length} course{timing.assignments.length !== 1 ? 's' : ''} · {timing.totalEnrolled} enrolled
                              </p>
                            </div>

                            <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-3">
                              <div className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-slate-900 shadow-sm">
                                Seats left
                                <div className="mt-1 text-xl">{timing.seatsLeft}</div>
                              </div>
                              <div className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-slate-900 shadow-sm">
                                Enrolled
                                <div className="mt-1 text-xl">{timing.totalEnrolled}</div>
                              </div>
                              <div className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-slate-900 shadow-sm">
                                Courses
                                <div className="mt-1 text-xl">{timing.assignments.length}</div>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleTiming(timing.slotId)}
                            className="mt-5 inline-flex items-center justify-between w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-left text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
                          >
                            <span>{timingOpen ? 'Hide course details' : 'Show course details'}</span>
                            {timingOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>

                          {timingOpen && (
                            <div className="mt-4 space-y-4">
                              {timing.assignments.map((assignment) => (
                                <div key={assignment.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                      <p className="text-sm text-slate-500">Course</p>
                                      <p className="mt-1 text-lg font-semibold text-slate-900">{assignment.courseName}</p>
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
                                              <p className="font-medium text-slate-900">{student.name}</p>
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
              </article>
            )
          )}
        )}
      </div>
    </div>
  )
}
