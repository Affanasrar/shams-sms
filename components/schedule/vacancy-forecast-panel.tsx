'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Users,
  GraduationCap,
  ChevronRight,
  Filter,
  ArrowUpRight
} from 'lucide-react'
import { formatSlotTimeRange } from '@/lib/seat-engine'

export interface VacancyStudentItem {
  enrollmentId: string
  studentId: string
  studentName: string
  fatherName?: string
  phone?: string
  courseName: string
  courseDurationMonths: number
  slotId: string
  days: string
  startTime: string | Date
  endTime: string | Date
  roomName: string
  roomCapacity: number
  teacherName?: string
  joiningDate: string | Date
  endDate: string | Date
  daysRemaining: number
}

interface VacancyForecastPanelProps {
  assignments: Array<{
    id: string
    course: { name: string; durationMonths: number }
    slot: {
      id: string
      startTime: string | Date
      endTime: string | Date
      days: string
      room: { name: string; capacity: number }
    }
    teacher?: { firstName: string | null; lastName: string | null } | null
    enrollments: Array<{
      id: string
      joiningDate?: string | Date
      endDate?: string | Date | null
      status?: string
      student: {
        id: string
        studentId?: string
        name: string
        fatherName?: string
        phone?: string
      }
    }>
  }>
}

export function VacancyForecastPanel({ assignments }: VacancyForecastPanelProps) {
  const [timeHorizon, setTimeHorizon] = useState<'7' | '14' | '30' | '60' | 'ALL'>('30')

  // Extract all future graduating students
  const upcomingVacancies = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const items: VacancyStudentItem[] = []

    assignments.forEach((assignment) => {
      const { course, slot, teacher, enrollments } = assignment
      const teacherName = teacher?.firstName
        ? `${teacher.firstName} ${teacher.lastName || ''}`.trim()
        : 'TBD'

      enrollments.forEach((enrollment) => {
        if (!enrollment.endDate) return
        const end = new Date(enrollment.endDate)
        if (isNaN(end.getTime()) || end < today) return

        const diffTime = end.getTime() - today.getTime()
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        items.push({
          enrollmentId: enrollment.id,
          studentId: enrollment.student.id,
          studentName: enrollment.student.name,
          fatherName: enrollment.student.fatherName,
          phone: enrollment.student.phone,
          courseName: course.name,
          courseDurationMonths: course.durationMonths,
          slotId: slot.id,
          days: slot.days,
          startTime: slot.startTime,
          endTime: slot.endTime,
          roomName: slot.room.name,
          roomCapacity: slot.room.capacity,
          teacherName,
          joiningDate: enrollment.joiningDate || today,
          endDate: end,
          daysRemaining
        })
      })
    })

    return items.sort((a, b) => a.daysRemaining - b.daysRemaining)
  }, [assignments])

  // Filter based on selected time horizon
  const filteredItems = useMemo(() => {
    if (timeHorizon === 'ALL') return upcomingVacancies
    const maxDays = parseInt(timeHorizon, 10)
    return upcomingVacancies.filter((item) => item.daysRemaining <= maxDays)
  }, [upcomingVacancies, timeHorizon])

  // Group by timeframe buckets for metrics
  const next7DaysCount = upcomingVacancies.filter((i) => i.daysRemaining <= 7).length
  const next14DaysCount = upcomingVacancies.filter((i) => i.daysRemaining <= 14).length
  const next30DaysCount = upcomingVacancies.filter((i) => i.daysRemaining <= 30).length

  return (
    <div className="rounded-[32px] border border-border bg-card p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-950/50 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 mb-2">
            <GraduationCap size={14} />
            Capacity Pipeline
          </div>
          <h2 className="text-2xl font-bold text-foreground">Upcoming Seat Openings (Vacancy Forecast)</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track student course completion dates to forecast chair availability and pre-book walk-ins.
          </p>
        </div>

        {/* Horizon Tabs */}
        <div className="flex items-center gap-1.5 rounded-2xl bg-muted p-1.5 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setTimeHorizon('7')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              timeHorizon === '7'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            7 Days ({next7DaysCount})
          </button>
          <button
            type="button"
            onClick={() => setTimeHorizon('14')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              timeHorizon === '14'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            14 Days ({next14DaysCount})
          </button>
          <button
            type="button"
            onClick={() => setTimeHorizon('30')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              timeHorizon === '30'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            30 Days ({next30DaysCount})
          </button>
          <button
            type="button"
            onClick={() => setTimeHorizon('ALL')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              timeHorizon === 'ALL'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All ({upcomingVacancies.length})
          </button>
        </div>
      </div>

      {/* Vacancy Roster Table */}
      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center space-y-2">
          <p className="text-base font-semibold text-foreground">No upcoming completions in this timeframe</p>
          <p className="text-sm text-muted-foreground">
            Try switching to &quot;30 Days&quot; or &quot;All&quot; to see upcoming completions further out.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/60 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
              <tr>
                <th className="p-4">Opening Date</th>
                <th className="p-4">Course & Slot</th>
                <th className="p-4">Lab & Teacher</th>
                <th className="p-4">Completing Student</th>
                <th className="p-4 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredItems.map((item) => {
                const isVerySoon = item.daysRemaining <= 7
                const isSoon = item.daysRemaining <= 14

                return (
                  <tr key={item.enrollmentId} className="hover:bg-muted/30 transition-colors">
                    {/* Date Column */}
                    <td className="p-4 align-middle">
                      <div className="space-y-1">
                        <span className="font-semibold text-foreground">
                          {new Date(item.endDate).toLocaleDateString('en-US', {
                            timeZone: 'Asia/Karachi',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                        <div>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              isVerySoon
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                : isSoon
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                            }`}
                          >
                            {item.daysRemaining === 0 ? 'Today' : item.daysRemaining === 1 ? 'Tomorrow' : `In ${item.daysRemaining} days`}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Course & Slot */}
                    <td className="p-4 align-middle">
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground">{item.courseName}</p>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock size={12} className="text-indigo-500" />
                          <span>{item.days} • {formatSlotTimeRange(item.startTime, item.endTime)}</span>
                        </div>
                      </div>
                    </td>

                    {/* Lab & Teacher */}
                    <td className="p-4 align-middle">
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-1.5 font-medium text-foreground">
                          <MapPin size={12} className="text-indigo-500" />
                          <span>{item.roomName} (Cap: {item.roomCapacity})</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Sparkles size={12} className="text-sky-500" />
                          <span>{item.teacherName}</span>
                        </div>
                      </div>
                    </td>

                    {/* Student */}
                    <td className="p-4 align-middle">
                      <div className="space-y-0.5 text-xs">
                        <p className="font-semibold text-foreground">{item.studentName}</p>
                        {item.fatherName && (
                          <p className="text-muted-foreground">s/o {item.fatherName}</p>
                        )}
                        {item.phone && (
                          <p className="text-muted-foreground">{item.phone}</p>
                        )}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="p-4 align-middle text-right">
                      <Link
                        href={`/admin/enrollment/new`}
                        className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition dark:bg-slate-100 dark:text-slate-900"
                      >
                        Reserve Seat
                        <ArrowUpRight size={13} />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
