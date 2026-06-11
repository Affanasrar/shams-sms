'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, Search, List, CalendarDays } from 'lucide-react'

export type SlotGroup = {
  slotId: string
  days: string
  startTime: string
  endTime: string
  room: { name: string; capacity: number }
  assignments: {
    id: string
    courseName: string
    enrolledCount: number
    students: Array<{ id: string; enrollmentId: string; name: string; fatherName: string; phone: string }>
  }[]
  totalEnrolled: number
  seatsLeft: number
}

interface ReceptionistSchedulePanelProps {
  slotGroups: SlotGroup[]
}

export function ReceptionistSchedulePanel({ slotGroups }: ReceptionistSchedulePanelProps) {
  const [query, setQuery] = useState('')
  const [activeQuery, setActiveQuery] = useState('')
  const [openGroups, setOpenGroups] = useState<string[]>([])

  const filteredGroups = useMemo(() => {
    const term = activeQuery.trim().toLowerCase()
    if (!term) {
      return slotGroups
    }

    return slotGroups.filter((group) => {
      const timeLabel = `${new Date(group.startTime).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Karachi'
      })} - ${new Date(group.endTime).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Karachi'
      })}`.toLowerCase()

      return (
        group.days.toLowerCase().includes(term) ||
        group.room.name.toLowerCase().includes(term) ||
        timeLabel.includes(term) ||
        group.assignments.some((assignment) =>
          assignment.courseName.toLowerCase().includes(term) ||
          assignment.students.some((student) =>
            student.enrollmentId.toLowerCase().includes(term) ||
            student.name.toLowerCase().includes(term) ||
            student.fatherName.toLowerCase().includes(term)
          )
        )
      )
    })
  }, [activeQuery, slotGroups])

  const toggleGroup = (slotId: string) => {
    setOpenGroups((prev) =>
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
      <div className="grid gap-4 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-500 mb-2">Search schedule</p>
          <div className="flex gap-2">
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
                placeholder="Search slot, room, course, student"
                className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-sm shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-100"
              />
            </label>
            <button
              type="button"
              onClick={handleSearch}
              className="rounded-xl bg-cyan-600 px-4 text-white transition hover:bg-cyan-700"
            >
              Search
            </button>
          </div>
          {activeQuery && (
            <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
              <span>Filtering by: <strong>{activeQuery}</strong></span>
              <button type="button" onClick={clearSearch} className="font-semibold text-cyan-600 hover:text-cyan-700">
                Clear
              </button>
            </div>
          )}
        </div>

        <Link href="/receptionist/students" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-cyan-300">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">Admissions</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">Student list</p>
            </div>
            <List className="text-cyan-600" />
          </div>
        </Link>

        <Link href="/receptionist/enrollment" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-cyan-300">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">Enrollments</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">Enrollment list</p>
            </div>
            <CalendarDays className="text-cyan-600" />
          </div>
        </Link>
      </div>

      <div className="grid gap-4">
        {filteredGroups.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-600 shadow-sm">
            No matching schedules found. Try a different course name, room, or student.
          </div>
        ) : (
          filteredGroups.map((group) => {
            const isOpen = openGroups.includes(group.slotId)
            const occupancyPercent = Math.round((group.totalEnrolled / group.room.capacity) * 100)

            return (
              <article key={group.slotId} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{group.days} • {new Date(group.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })} - {new Date(group.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })}</p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-900">{group.room.name}</h2>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 p-4 text-center">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Courses</p>
                      <p className="mt-2 text-xl font-semibold text-slate-900">{group.assignments.length}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4 text-center">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Enrolled</p>
                      <p className="mt-2 text-xl font-semibold text-slate-900">{group.totalEnrolled}</p>
                    </div>
                    <div className={`rounded-2xl p-4 text-center ${group.seatsLeft === 0 ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      <p className="text-xs uppercase tracking-[0.2em]">Seats left</p>
                      <p className="mt-2 text-xl font-semibold">{group.seatsLeft}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between gap-3 text-sm text-slate-500">
                    <div>Room capacity</div>
                    <div>{group.room.capacity}</div>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-cyan-600" style={{ width: `${Math.min(occupancyPercent, 100)}%` }} />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleGroup(group.slotId)}
                  className="mt-6 inline-flex items-center justify-between w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  <span>{isOpen ? 'Hide courses and student details' : 'Show courses and student details'}</span>
                  {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {isOpen && (
                  <div className="mt-4 space-y-4">
                    {group.assignments.map((assignment) => (
                      <div key={assignment.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-sm text-slate-500">Course</p>
                            <p className="mt-1 text-lg font-semibold text-slate-900">{assignment.courseName}</p>
                          </div>
                          <div className="rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm">
                            Enrolled: {assignment.enrolledCount}
                          </div>
                        </div>

                        <div className="mt-4 rounded-2xl bg-white p-4 text-sm text-slate-700">
                          {assignment.students.length === 0 ? (
                            <p className="text-slate-500">No enrolled students yet.</p>
                          ) : (
                            <div className="space-y-3">
                              {assignment.students.map((student) => (
                                <div key={student.id} className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
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
              </article>
            )
          })
        )}
      </div>
    </div>
  )
}
