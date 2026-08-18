'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Search,
  Clock,
  MapPin,
  Sparkles,
  Users,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Filter,
  RefreshCw,
  BookOpen
} from 'lucide-react'
import { getSlotSeatSummary, formatSlotTimeRange, type SeatStatus } from '@/lib/seat-engine'

export interface QuickFinderSlotAssignment {
  id: string
  courseId: string
  slotId: string
  course: {
    id: string
    name: string
    durationMonths: number
    baseFee?: number
  }
  slot: {
    id: string
    startTime: string | Date
    endTime: string | Date
    days: string
    room: {
      id: string
      name: string
      capacity: number
    }
  }
  teacher?: {
    id: string
    firstName: string | null
    lastName: string | null
  } | null
  enrollments: Array<{
    id: string
    status?: string
    endDate?: string | Date | null
  }>
}

interface QuickSeatFinderProps {
  assignments: QuickFinderSlotAssignment[]
  enrollBasePath?: string
  title?: string
  description?: string
}

export function QuickSeatFinder({
  assignments,
  enrollBasePath = '/admin/enrollment/new',
  title = 'Quick Seat Finder',
  description = 'Instantly find available seats and timings for student intake and inquiries'
}: QuickSeatFinderProps) {
  const [courseFilter, setCourseFilter] = useState<string>('ALL')
  const [dayFilter, setDayFilter] = useState<string>('ALL')
  const [timeWindowFilter, setTimeWindowFilter] = useState<string>('ALL')
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')

  // 1. Extract unique courses
  const uniqueCourses = useMemo(() => {
    const courseMap = new Map<string, string>()
    assignments.forEach((a) => {
      if (a.course?.id && a.course?.name) {
        courseMap.set(a.course.id, a.course.name)
      }
    })
    return Array.from(courseMap.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [assignments])

  // 2. Extract unique days
  const uniqueDays = useMemo(() => {
    const daysSet = new Set<string>()
    assignments.forEach((a) => {
      if (a.slot?.days) {
        daysSet.add(a.slot.days)
      }
    })
    return Array.from(daysSet).sort()
  }, [assignments])

  // 3. Compute slot-level occupancy
  const slotOccupancyMap = useMemo(() => {
    const map = new Map<string, { total: number; enrollments: QuickFinderSlotAssignment['enrollments'] }>()
    assignments.forEach((a) => {
      const slotId = a.slot.id
      if (!map.has(slotId)) {
        map.set(slotId, { total: 0, enrollments: [] })
      }
      const entry = map.get(slotId)!
      const activeEnrollments = (a.enrollments || []).filter(
        (e) => !e.status || e.status === 'ACTIVE' || e.status === 'PENDING_COMPLETION'
      )
      entry.total += activeEnrollments.length
      entry.enrollments.push(...activeEnrollments)
    })
    return map
  }, [assignments])

  // 4. Filter and rank results
  const filteredAssignments = useMemo(() => {
    return assignments
      .map((a) => {
        const slotOccupancy = slotOccupancyMap.get(a.slot.id)
        const allEnrollments = slotOccupancy?.enrollments || a.enrollments || []
        const summary = getSlotSeatSummary(a.slot.room.capacity, allEnrollments, {
          id: a.slot.id,
          roomName: a.slot.room.name,
          days: a.slot.days,
          startTime: a.slot.startTime,
          endTime: a.slot.endTime
        })

        const start = new Date(a.slot.startTime)
        const startHour = start.getHours()

        // Time window classification
        let timeWindow = 'OTHER'
        if (startHour >= 7 && startHour < 13) {
          timeWindow = 'MORNING'
        } else if (startHour >= 13 && startHour < 17) {
          timeWindow = 'AFTERNOON'
        } else if (startHour >= 17 && startHour < 22) {
          timeWindow = 'EVENING'
        }

        return {
          ...a,
          seatSummary: summary,
          timeWindow,
          timeRangeLabel: formatSlotTimeRange(a.slot.startTime, a.slot.endTime)
        }
      })
      .filter((item) => {
        // Course filter
        if (courseFilter !== 'ALL' && item.course.id !== courseFilter) {
          return false
        }

        // Day filter
        if (dayFilter !== 'ALL' && item.slot.days !== dayFilter) {
          return false
        }

        // Time window filter
        if (timeWindowFilter !== 'ALL' && item.timeWindow !== timeWindowFilter) {
          return false
        }

        // Availability filter
        if (onlyAvailable && item.seatSummary.status === 'FULL') {
          return false
        }

        // Free search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase()
          const matchesCourse = item.course.name.toLowerCase().includes(q)
          const matchesRoom = item.slot.room.name.toLowerCase().includes(q)
          const matchesTeacher = `${item.teacher?.firstName || ''} ${item.teacher?.lastName || ''}`.toLowerCase().includes(q)
          const matchesDays = item.slot.days.toLowerCase().includes(q)
          if (!matchesCourse && !matchesRoom && !matchesTeacher && !matchesDays) {
            return false
          }
        }

        return true
      })
      .sort((a, b) => {
        // Sort by availability first (most free seats), then start time
        if (b.seatSummary.availableSeats !== a.seatSummary.availableSeats) {
          return b.seatSummary.availableSeats - a.seatSummary.availableSeats
        }
        return new Date(a.slot.startTime).getTime() - new Date(b.slot.startTime).getTime()
      })
  }, [assignments, courseFilter, dayFilter, timeWindowFilter, onlyAvailable, searchQuery, slotOccupancyMap])

  const handleReset = () => {
    setCourseFilter('ALL')
    setDayFilter('ALL')
    setTimeWindowFilter('ALL')
    setOnlyAvailable(true)
    setSearchQuery('')
  }

  return (
    <div className="rounded-[32px] border border-border bg-card p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 dark:border-cyan-900 bg-cyan-50 dark:bg-cyan-950/50 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-300 mb-2">
            <Sparkles size={13} />
            Instant Seat Intake
          </div>
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-muted px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition self-start sm:self-center"
        >
          <RefreshCw size={13} />
          Reset Filters
        </button>
      </div>

      {/* Filter Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Course Filter */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
            Course
          </label>
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="w-full rounded-2xl border border-border bg-muted/70 px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-indigo-500 focus:bg-card focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">All Courses ({uniqueCourses.length})</option>
            {uniqueCourses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Days Filter */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
            Days
          </label>
          <select
            value={dayFilter}
            onChange={(e) => setDayFilter(e.target.value)}
            className="w-full rounded-2xl border border-border bg-muted/70 px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-indigo-500 focus:bg-card focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">Any Days</option>
            {uniqueDays.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Time Window */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
            Time of Day
          </label>
          <select
            value={timeWindowFilter}
            onChange={(e) => setTimeWindowFilter(e.target.value)}
            className="w-full rounded-2xl border border-border bg-muted/70 px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-indigo-500 focus:bg-card focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">Any Time</option>
            <option value="MORNING">Morning (9:00 AM - 1:00 PM)</option>
            <option value="AFTERNOON">Afternoon (1:00 PM - 5:00 PM)</option>
            <option value="EVENING">Evening (5:00 PM - 9:00 PM)</option>
          </select>
        </div>

        {/* Text Search */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
            Search Keyword
          </label>
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Room, teacher, name..."
              className="w-full rounded-2xl border border-border bg-muted/70 py-2.5 pl-9 pr-3 text-sm text-foreground outline-none transition focus:border-indigo-500 focus:bg-card focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>
      </div>

      {/* Checkbox Toggle */}
      <div className="flex items-center gap-3 pt-1">
        <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-foreground">
          <input
            type="checkbox"
            checked={onlyAvailable}
            onChange={(e) => setOnlyAvailable(e.target.checked)}
            className="h-4 w-4 rounded border-border text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
          <span>Show only slots with open seats</span>
        </label>
        <span className="text-xs text-muted-foreground">
          ({filteredAssignments.length} matching slots found)
        </span>
      </div>

      {/* Results Grid */}
      {filteredAssignments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center space-y-2">
          <p className="text-base font-semibold text-foreground">No matching slots found</p>
          <p className="text-sm text-muted-foreground">
            Try broadening your filter criteria or unchecking &quot;Show only slots with open seats&quot;.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAssignments.map((item) => {
            const { seatSummary } = item
            const isFull = seatSummary.status === 'FULL'
            const isAlmostFull = seatSummary.status === 'ALMOST_FULL'
            const teacherName = item.teacher?.firstName
              ? `${item.teacher.firstName} ${item.teacher.lastName || ''}`.trim()
              : 'TBD'

            return (
              <div
                key={item.id}
                className={`rounded-[24px] border p-4.5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between ${
                  isFull
                    ? 'border-rose-200 bg-rose-50/40 dark:border-rose-900/40 dark:bg-rose-950/10'
                    : isAlmostFull
                    ? 'border-amber-200 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/10'
                    : 'border-border bg-card'
                }`}
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      {item.slot.days}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                        isFull
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          : isAlmostFull
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}
                    >
                      {isFull ? 'FULL' : `${seatSummary.availableSeats} Open Seats`}
                    </span>
                  </div>

                  {/* Course Name */}
                  <h3 className="font-bold text-foreground text-base leading-snug mb-2">
                    {item.course.name}
                  </h3>

                  {/* Timing & Location Details */}
                  <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                      <Clock size={13} className="text-indigo-500 shrink-0" />
                      <span className="font-medium text-foreground">{item.timeRangeLabel}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="text-sky-500 shrink-0" />
                      <span>{item.slot.room.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles size={13} className="text-amber-500 shrink-0" />
                      <span>Teacher: {teacherName}</span>
                    </div>
                  </div>

                  {/* Occupancy bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs font-medium text-muted-foreground mb-1">
                      <span>Occupancy</span>
                      <span className="font-bold text-foreground">
                        {seatSummary.totalEnrolled}/{seatSummary.roomCapacity}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isFull
                            ? 'bg-rose-500'
                            : isAlmostFull
                            ? 'bg-amber-500'
                            : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                        }`}
                        style={{ width: `${seatSummary.occupancyPercent}%` }}
                      />
                    </div>
                  </div>

                  {isFull && seatSummary.nextVacancyDate && (
                    <div className="mb-4 rounded-xl bg-card/80 p-2.5 border border-rose-200 dark:border-rose-900/40 text-xs font-medium text-rose-700 dark:text-rose-300">
                      ⏳ Next seat opens: {new Date(seatSummary.nextVacancyDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Karachi' })}
                    </div>
                  )}
                </div>

                {/* Bottom Enroll CTA */}
                <div>
                  {!isFull ? (
                    <Link
                      href={enrollBasePath}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-3.5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-sm"
                    >
                      <CheckCircle2 size={14} />
                      Enroll in this Slot
                    </Link>
                  ) : (
                    <div className="rounded-2xl bg-muted px-3.5 py-2.5 text-center text-xs font-semibold text-muted-foreground">
                      No Seats Available
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
