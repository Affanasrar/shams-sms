'use client'

import { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Users,
  Clock,
  MapPin,
  Sparkles,
  Search,
  X,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ArrowRightLeft,
  Loader2,
  Building2,
  BookOpen,
  Filter,
  Timer
} from 'lucide-react'
import { formatSlotTimeRange, getSlotSeatSummary } from '@/lib/seat-engine'
import { changeEnrollmentTiming } from '@/app/actions/enrollment'

export interface MatrixAssignment {
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
    endDate?: string | Date | null
    joiningDate?: string | Date
    status?: string
    student: {
      id: string
      studentId?: string
      name: string
      phone?: string
      fatherName?: string
    }
  }>
}

interface RoomInfo {
  id: string
  name: string
  capacity: number
}

interface ScheduleMatrixGridProps {
  assignments: MatrixAssignment[]
  rooms: RoomInfo[]
  baseEnrollUrl?: string
}

function getHourInKarachi(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date) : date
  const timeStr = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    hour12: false,
    timeZone: 'Asia/Karachi'
  })
  return parseInt(timeStr, 10)
}

function formatHourBlock(hour24: number): string {
  const formatH = (h: number) => {
    const h12 = h % 12 === 0 ? 12 : h % 12
    const ampm = h >= 12 && h < 24 ? 'PM' : 'AM'
    return `${h12.toString().padStart(2, '0')}:00 ${ampm}`
  }
  return `${formatH(hour24)} - ${formatH(hour24 + 1)}`
}

export function ScheduleMatrixGrid({
  assignments,
  rooms,
  baseEnrollUrl = '/admin/enrollment/new'
}: ScheduleMatrixGridProps) {
  const router = useRouter()

  // Filters
  const [selectedDay, setSelectedDay] = useState<string>('ALL')
  const [selectedRoomId, setSelectedRoomId] = useState<string>('ALL')
  const [selectedCourseId, setSelectedCourseId] = useState<string>('ALL')
  const [selectedSeatStatus, setSelectedSeatStatus] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Slide-over Drawer State
  const [selectedCellSlotId, setSelectedCellSlotId] = useState<string | null>(null)

  // Student Transfer State
  const [transferringEnrollment, setTransferringEnrollment] = useState<{
    enrollmentId: string
    studentName: string
    courseId: string
    courseName: string
    currentSlotId: string
    currentSlotDays: string
    currentSlotTime: string
    currentRoomName: string
  } | null>(null)
  const [targetSlotAssignmentId, setTargetSlotAssignmentId] = useState<string>('')
  const [isTransferring, startTransferTransition] = useTransition()
  const [transferMessage, setTransferMessage] = useState<{ success: boolean; text: string } | null>(null)

  // 1. Extract unique courses
  const uniqueCourses = useMemo(() => {
    const courseMap = new Map<string, string>()
    assignments.forEach((a) => {
      if (a.course?.id && a.course?.name) {
        courseMap.set(a.course.id, a.course.name)
      }
    })
    return Array.from(courseMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [assignments])

  // 2. Extract unique day patterns
  const uniqueDays = useMemo(() => {
    const daySet = new Set<string>()
    assignments.forEach((a) => {
      if (a.slot?.days) {
        daySet.add(a.slot.days)
      }
    })
    return Array.from(daySet).sort()
  }, [assignments])

  // 3. Group assignments by Slot ID
  const slotGroups = useMemo(() => {
    const map = new Map<
      string,
      {
        slotId: string
        room: RoomInfo
        startTime: Date
        endTime: Date
        timeRangeKey: string
        timeRangeFormatted: string
        days: string
        assignments: MatrixAssignment[]
        allEnrollments: Array<{
          id: string
          courseId: string
          courseName: string
          assignmentId: string
          endDate?: string | Date | null
          joiningDate?: string | Date
          status?: string
          student: {
            id: string
            studentId?: string
            name: string
            phone?: string
            fatherName?: string
          }
        }>
        seatSummary: ReturnType<typeof getSlotSeatSummary>
      }
    >()

    assignments.forEach((a) => {
      const slotId = a.slot.id
      const start = new Date(a.slot.startTime)
      const end = new Date(a.slot.endTime)
      const timeRangeFormatted = formatSlotTimeRange(start, end)
      const timeRangeKey = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')} - ${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`

      if (!map.has(slotId)) {
        map.set(slotId, {
          slotId,
          room: a.slot.room,
          startTime: start,
          endTime: end,
          timeRangeKey,
          timeRangeFormatted,
          days: a.slot.days,
          assignments: [],
          allEnrollments: [],
          seatSummary: {} as any
        })
      }

      const entry = map.get(slotId)!
      entry.assignments.push(a)
      const enrollmentsList = a.enrollments || []
      enrollmentsList.forEach((e) => {
        entry.allEnrollments.push({
          ...e,
          courseId: a.course.id,
          courseName: a.course.name,
          assignmentId: a.id
        })
      })
    })

    // Compute seat summary
    map.forEach((entry) => {
      entry.seatSummary = getSlotSeatSummary(
        entry.room.capacity,
        entry.allEnrollments,
        {
          id: entry.slotId,
          roomName: entry.room.name,
          days: entry.days,
          startTime: entry.startTime,
          endTime: entry.endTime,
          assignmentsCount: entry.assignments.length
        }
      )
    })

    return map
  }, [assignments])

  // 4. Map Slots with Hourly Coordinates (startHour, endHour, durationHours)
  const slotHourlyEntries = useMemo(() => {
    return Array.from(slotGroups.values()).map((g) => {
      const startHour = getHourInKarachi(g.startTime)
      let endHour = getHourInKarachi(g.endTime)
      if (endHour <= startHour) {
        endHour = startHour + 1
      }
      const durationHours = Math.max(1, endHour - startHour)
      return {
        ...g,
        startHour,
        endHour,
        durationHours
      }
    })
  }, [slotGroups])

  // 5. Compute Continuous Hourly Timeline Blocks
  const hourlyTimeBlocks = useMemo(() => {
    if (slotHourlyEntries.length === 0) {
      return [
        { hour: 9, label: formatHourBlock(9) },
        { hour: 10, label: formatHourBlock(10) },
        { hour: 11, label: formatHourBlock(11) },
        { hour: 12, label: formatHourBlock(12) }
      ]
    }

    const minHour = Math.min(...slotHourlyEntries.map((s) => s.startHour), 9)
    const maxHour = Math.max(...slotHourlyEntries.map((s) => s.endHour), 20)

    const blocks = []
    for (let h = minHour; h < maxHour; h++) {
      blocks.push({
        hour: h,
        label: formatHourBlock(h)
      })
    }
    return blocks
  }, [slotHourlyEntries])

  // 6. Filtered Rooms
  const displayedRooms = useMemo(() => {
    const base = [...rooms].sort((a, b) => a.name.localeCompare(b.name))
    if (selectedRoomId === 'ALL') return base
    return base.filter((r) => r.id === selectedRoomId || r.name === selectedRoomId)
  }, [rooms, selectedRoomId])

  // 7. Active Filter Check Helper
  const isSlotMatched = (slotEntry: (typeof slotHourlyEntries)[0]) => {
    if (!slotEntry) return false

    // Day filter
    if (selectedDay !== 'ALL' && slotEntry.days !== selectedDay) {
      return false
    }

    // Room filter
    if (selectedRoomId !== 'ALL' && slotEntry.room.id !== selectedRoomId && slotEntry.room.name !== selectedRoomId) {
      return false
    }

    // Course filter
    if (selectedCourseId !== 'ALL' && !slotEntry.assignments.some((a) => a.course.id === selectedCourseId)) {
      return false
    }

    // Seat status filter
    if (selectedSeatStatus !== 'ALL' && slotEntry.seatSummary.status !== selectedSeatStatus) {
      return false
    }

    // Search query
    const query = searchQuery.trim().toLowerCase()
    if (query) {
      const matchesRoom = slotEntry.room.name.toLowerCase().includes(query)
      const matchesDays = slotEntry.days.toLowerCase().includes(query)
      const matchesTime = slotEntry.timeRangeFormatted.toLowerCase().includes(query)
      const matchesCourse = slotEntry.assignments.some((a) => a.course.name.toLowerCase().includes(query))
      const matchesTeacher = slotEntry.assignments.some((a) => {
        const tName = `${a.teacher?.firstName || ''} ${a.teacher?.lastName || ''}`.toLowerCase()
        return tName.includes(query)
      })
      const matchesStudent = slotEntry.allEnrollments.some((e) =>
        e.student.name.toLowerCase().includes(query) ||
        (e.student.fatherName && e.student.fatherName.toLowerCase().includes(query)) ||
        (e.student.studentId && e.student.studentId.toLowerCase().includes(query))
      )

      if (!matchesRoom && !matchesDays && !matchesTime && !matchesCourse && !matchesTeacher && !matchesStudent) {
        return false
      }
    }

    return true
  }

  // Active drawer slot
  const activeDrawerSlot = selectedCellSlotId ? slotGroups.get(selectedCellSlotId) : null

  // Alternative slots for transferring student
  const alternativeSlotsForTransfer = useMemo(() => {
    if (!transferringEnrollment) return []
    return assignments
      .filter(
        (a) =>
          a.courseId === transferringEnrollment.courseId &&
          a.slotId !== transferringEnrollment.currentSlotId
      )
      .map((a) => {
        // Use the aggregated slotGroup which gathers all active students sharing this physical slot
        const slotGroup = slotGroups.get(a.slot.id)
        const summary = slotGroup
          ? slotGroup.seatSummary
          : getSlotSeatSummary(a.slot.room.capacity, a.enrollments || [], {
              id: a.slot.id,
              roomName: a.slot.room.name,
              days: a.slot.days,
              startTime: a.slot.startTime,
              endTime: a.slot.endTime
            })

        return {
          assignmentId: a.id,
          slotId: a.slot.id,
          days: a.slot.days,
          roomName: a.slot.room.name,
          timeRangeFormatted: formatSlotTimeRange(a.slot.startTime, a.slot.endTime),
          summary
        }
      })
      .sort((a, b) => a.days.localeCompare(b.days))
  }, [transferringEnrollment, assignments, slotGroups])

  const handleConfirmTransfer = () => {
    if (!transferringEnrollment || !targetSlotAssignmentId) return
    setTransferMessage(null)

    startTransferTransition(async () => {
      const result = await changeEnrollmentTiming(
        transferringEnrollment.enrollmentId,
        targetSlotAssignmentId
      )
      if (result.success) {
        setTransferMessage({ success: true, text: (result as any).message || 'Student timing updated successfully!' })
        setTimeout(() => {
          setTransferringEnrollment(null)
          setTargetSlotAssignmentId('')
          setTransferMessage(null)
          router.refresh()
        }, 1200)
      } else {
        setTransferMessage({ success: false, text: (result as any).error || 'Failed to move student timing.' })
      }
    })
  }

  return (
    <div className="space-y-3">
      {/* ── Compact Filter Control Header ── */}
      <div className="rounded-[24px] border border-border bg-card/95 p-3.5 shadow-sm space-y-2.5">
        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {/* Room Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5 flex items-center gap-1">
              <Building2 size={11} className="text-indigo-500" /> Room
            </label>
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="w-full rounded-xl border border-border bg-muted/60 px-2.5 py-1.5 text-xs font-semibold text-foreground outline-none transition focus:border-indigo-500 focus:bg-card cursor-pointer"
            >
              <option value="ALL">All Rooms ({rooms.length})</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} (Cap: {r.capacity})
                </option>
              ))}
            </select>
          </div>

          {/* Course Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5 flex items-center gap-1">
              <BookOpen size={11} className="text-cyan-500" /> Course
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full rounded-xl border border-border bg-muted/60 px-2.5 py-1.5 text-xs font-semibold text-foreground outline-none transition focus:border-cyan-500 focus:bg-card cursor-pointer"
            >
              <option value="ALL">All Courses ({uniqueCourses.length})</option>
              {uniqueCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Day Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5 flex items-center gap-1">
              <Calendar size={11} className="text-emerald-500" /> Days
            </label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="w-full rounded-xl border border-border bg-muted/60 px-2.5 py-1.5 text-xs font-semibold text-foreground outline-none transition focus:border-emerald-500 focus:bg-card cursor-pointer"
            >
              <option value="ALL">All Days</option>
              {uniqueDays.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </div>

          {/* Seat Status Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5 flex items-center gap-1">
              <Users size={11} className="text-amber-500" /> Seats
            </label>
            <select
              value={selectedSeatStatus}
              onChange={(e) => setSelectedSeatStatus(e.target.value)}
              className="w-full rounded-xl border border-border bg-muted/60 px-2.5 py-1.5 text-xs font-semibold text-foreground outline-none transition focus:border-amber-500 focus:bg-card cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">🟢 Available (3+ Free)</option>
              <option value="ALMOST_FULL">🟡 Almost Full (1–2 Free)</option>
              <option value="FULL">🔴 Full (0 Free)</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="col-span-2 sm:col-span-2 md:col-span-4 lg:col-span-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5 flex items-center gap-1">
              <Search size={11} /> Search
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Teacher / Student..."
                className="w-full rounded-xl border border-border bg-muted/60 py-1.5 pl-2.5 pr-6 text-xs text-foreground outline-none transition placeholder:text-muted-foreground focus:border-indigo-500 focus:bg-card"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status Bar */}
        {(selectedDay !== 'ALL' || selectedRoomId !== 'ALL' || selectedCourseId !== 'ALL' || selectedSeatStatus !== 'ALL' || searchQuery) && (
          <div className="flex items-center justify-between border-t border-border/60 pt-2 text-[11px]">
            <span className="font-semibold text-foreground">
              Filtered Hourly Timetable active
            </span>
            <button
              type="button"
              onClick={() => {
                setSelectedDay('ALL')
                setSelectedRoomId('ALL')
                setSelectedCourseId('ALL')
                setSelectedSeatStatus('ALL')
                setSearchQuery('')
              }}
              className="rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 px-2.5 py-0.5 text-[10px] font-bold hover:bg-rose-100 transition cursor-pointer"
            >
              Reset Filters ✕
            </button>
          </div>
        )}
      </div>

      {/* ── Hourly Timetable Matrix with Multi-Hour Spanning (100% Width, Zero Horizontal Scroll) ── */}
      <div className="rounded-[24px] border border-border bg-card shadow-sm overflow-hidden w-full">
        <table className="w-full table-fixed border-collapse text-left text-xs">
          {/* Header Row: Room Columns */}
          <thead>
            <tr className="bg-muted/70 border-b border-border">
              <th className="w-28 sm:w-36 p-2.5 font-bold text-foreground text-center border-r border-border bg-muted/90">
                <div className="flex items-center justify-center gap-1 text-[11px]">
                  <Clock size={12} className="text-indigo-600 dark:text-indigo-400" />
                  <span>Hourly Slot</span>
                </div>
              </th>
              {displayedRooms.map((room) => (
                <th key={room.id} className="p-2.5 font-bold text-foreground border-r last:border-r-0 border-border">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1 truncate">
                      <MapPin size={11} className="text-indigo-500 shrink-0" />
                      <span className="truncate text-xs">{room.name}</span>
                    </div>
                    <span className="rounded-full bg-background px-1.5 py-0.2 text-[9px] font-semibold text-muted-foreground shrink-0 border border-border">
                      {room.capacity}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body: Hourly Rows with rowSpan for 2/3 hour courses */}
          <tbody className="divide-y divide-border">
            {hourlyTimeBlocks.map((block) => {
              const currentHour = block.hour

              return (
                <tr key={block.hour} className="hover:bg-muted/15 transition-colors">
                  {/* Hourly Time Cell */}
                  <td className="p-2 font-bold text-foreground border-r border-border bg-muted/30 text-center align-middle whitespace-nowrap">
                    <span className="text-[11px] block">{block.label}</span>
                  </td>

                  {/* Room Cells */}
                  {displayedRooms.map((room) => {
                    // Check if a slot STARTS at this hour
                    const startingSlot = slotHourlyEntries.find(
                      (g) => g.room.name === room.name && g.startHour === currentHour
                    )

                    // Check if a slot is SPANNING from an earlier hour
                    const spanningSlot = slotHourlyEntries.find(
                      (g) => g.room.name === room.name && g.startHour < currentHour && g.endHour > currentHour
                    )

                    // If spanning from earlier hour, DO NOT render <td> because rowSpan covers it!
                    if (spanningSlot) {
                      return null
                    }

                    // If no slot starts at this hour, render subtle empty cell
                    if (!startingSlot) {
                      return (
                        <td key={room.id} className="p-1.5 border-r last:border-r-0 border-border text-center align-middle bg-muted/5">
                          <span className="text-muted-foreground/40 text-[11px] font-mono select-none">—</span>
                        </td>
                      )
                    }

                    const isMatched = isSlotMatched(startingSlot)
                    const { seatSummary, assignments: slotAssignments, durationHours } = startingSlot
                    const isFull = seatSummary.status === 'FULL'
                    const isAlmostFull = seatSummary.status === 'ALMOST_FULL'
                    const isMultiHour = durationHours > 1

                    return (
                      <td
                        key={room.id}
                        rowSpan={durationHours}
                        className={`p-1.5 border-r last:border-r-0 border-border align-middle transition-opacity ${
                          !isMatched ? 'opacity-20 grayscale pointer-events-none' : ''
                        }`}
                      >
                        <div
                          onClick={() => setSelectedCellSlotId(startingSlot.slotId)}
                          className={`group cursor-pointer rounded-xl border p-2 transition-all duration-150 hover:shadow-md ${
                            isFull
                              ? 'border-rose-200 bg-rose-50/70 dark:border-rose-900/50 dark:bg-rose-950/25'
                              : isAlmostFull
                              ? 'border-amber-200 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/25'
                              : 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/25'
                          }`}
                        >
                          {/* Course Names & Duration Badge */}
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <div className="font-bold text-foreground text-xs truncate">
                              {slotAssignments.map((a) => a.course.name).join(' + ')}
                            </div>
                            
                            <div className="flex items-center gap-1 shrink-0">
                              {isMultiHour && (
                                <span className="inline-flex items-center gap-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.2 text-[8px] font-bold">
                                  <Timer size={9} /> {durationHours}h
                                </span>
                              )}
                              <span className="rounded bg-background/90 px-1 py-0.2 text-[8px] font-bold uppercase tracking-wider text-muted-foreground">
                                {startingSlot.days.slice(0, 7)}
                              </span>
                            </div>
                          </div>

                          {/* Teacher & Real-time Seat Badge */}
                          <div className="flex items-center justify-between gap-1 text-[10px]">
                            <span className="text-muted-foreground truncate">
                              {slotAssignments.map((a) => a.teacher?.firstName ? `${a.teacher.firstName}` : 'TBD').join(', ')}
                            </span>

                            <span
                              className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold shrink-0 ${
                                isFull
                                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300'
                                  : isAlmostFull
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                              }`}
                            >
                              {isFull ? 'FULL' : `${seatSummary.availableSeats} Free`}
                            </span>
                          </div>

                          {/* Multi-hour indicator line */}
                          {isMultiHour && (
                            <div className="mt-1 text-[9px] text-muted-foreground/80 flex items-center justify-between border-t border-border/40 pt-1">
                              <span>Full Timing: {startingSlot.timeRangeFormatted}</span>
                              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                                {startingSlot.allEnrollments.length}/{startingSlot.room.capacity} Enrolled
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Slide-over Drawer for Detailed Slot Roster & 1-Click Transfers ── */}
      {activeDrawerSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="h-full w-full max-w-xl overflow-y-auto rounded-none sm:rounded-[32px] border border-border bg-card p-6 shadow-2xl space-y-6">
            {/* Drawer Header */}
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 uppercase tracking-wider">
                    {activeDrawerSlot.days}
                  </span>
                  <span
                    className={`rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider ${
                      activeDrawerSlot.seatSummary.status === 'FULL'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                        : activeDrawerSlot.seatSummary.status === 'ALMOST_FULL'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    }`}
                  >
                    {activeDrawerSlot.seatSummary.status === 'FULL'
                      ? 'FULL'
                      : `${activeDrawerSlot.seatSummary.availableSeats} Seats Available`}
                  </span>
                </div>
                <h2 className="mt-2 text-xl font-bold text-foreground">
                  {activeDrawerSlot.room.name} • {activeDrawerSlot.timeRangeFormatted}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCellSlotId(null)
                  setTransferringEnrollment(null)
                }}
                className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Capacity Overview Card */}
            <div className="rounded-2xl border border-border bg-muted/40 p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Physical Room Capacity:</span>
                <span className="font-semibold text-foreground">{activeDrawerSlot.room.capacity} seats</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Currently Enrolled:</span>
                <span className="font-semibold text-foreground">{activeDrawerSlot.seatSummary.totalEnrolled} students</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Free Seats Left:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {activeDrawerSlot.seatSummary.availableSeats} seats
                </span>
              </div>

              {activeDrawerSlot.seatSummary.nextVacancyDate && (
                <div className="mt-2 rounded-xl bg-card p-2.5 border border-border flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Calendar size={13} className="text-indigo-500 shrink-0" />
                  <span>
                    Nearest graduation opening: <strong className="text-foreground">{new Date(activeDrawerSlot.seatSummary.nextVacancyDate).toLocaleDateString('en-US', { timeZone: 'Asia/Karachi', month: 'long', day: 'numeric', year: 'numeric' })}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Assigned Courses */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Assigned Courses ({activeDrawerSlot.assignments.length})
              </h3>
              <div className="space-y-2">
                {activeDrawerSlot.assignments.map((assignment) => {
                  const teacherName = assignment.teacher?.firstName
                    ? `${assignment.teacher.firstName} ${assignment.teacher.lastName || ''}`.trim()
                    : 'Teacher Not Assigned'

                  return (
                    <div key={assignment.id} className="rounded-2xl border border-border bg-card p-3.5 shadow-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-foreground text-sm">{assignment.course.name}</h4>
                        <span className="text-xs font-medium text-muted-foreground">
                          {assignment.enrollments?.length || 0} students
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Sparkles size={12} className="text-sky-500" />
                        <span>Teacher: <strong className="text-foreground">{teacherName}</strong></span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Enrolled Students Roster with 1-Click Move Timing */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Enrolled Students ({activeDrawerSlot.allEnrollments.length})
                </h3>
              </div>

              {activeDrawerSlot.allEnrollments.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-3 text-center">
                  No students currently enrolled in this slot.
                </p>
              ) : (
                <div className="divide-y divide-border rounded-2xl border border-border bg-card overflow-hidden">
                  {activeDrawerSlot.allEnrollments.map((enrollment) => {
                    const student = enrollment.student
                    return (
                      <div key={enrollment.id} className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-muted/30 transition">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-foreground text-sm">{student.name}</p>
                            <span className="rounded bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.2 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300">
                              {enrollment.courseName}
                            </span>
                          </div>
                          <p className="text-muted-foreground text-xs">
                            {student.studentId ? `${student.studentId} • ` : ''}Father: {student.fatherName || 'N/A'} • {student.phone || 'No phone'}
                          </p>
                        </div>
                        
                        {/* 1-Click Transfer Trigger */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setTransferMessage(null)
                              setTargetSlotAssignmentId('')
                              setTransferringEnrollment({
                                enrollmentId: enrollment.id,
                                studentName: student.name,
                                courseId: enrollment.courseId,
                                courseName: enrollment.courseName,
                                currentSlotId: activeDrawerSlot.slotId,
                                currentSlotDays: activeDrawerSlot.days,
                                currentSlotTime: activeDrawerSlot.timeRangeFormatted,
                                currentRoomName: activeDrawerSlot.room.name
                              })
                            }}
                            className="inline-flex items-center gap-1 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/80 dark:bg-indigo-950/40 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition cursor-pointer"
                            title="Move this student to another timing slot for this course"
                          >
                            <ArrowRightLeft size={12} />
                            <span>Move Timing</span>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* In-Roster Student Slot Transfer Modal */}
            {transferringEnrollment && (
              <div className="rounded-[24px] border-2 border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 p-5 space-y-4 shadow-lg animate-in zoom-in-95 duration-150">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                      <ArrowRightLeft size={13} />
                      1-Click Student Transfer
                    </span>
                    <h4 className="text-base font-bold text-foreground mt-0.5">
                      Move {transferringEnrollment.studentName}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Course: <strong>{transferringEnrollment.courseName}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTransferringEnrollment(null)
                      setTransferMessage(null)
                    }}
                    className="text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Current vs Target */}
                <div className="rounded-xl bg-card p-3 text-xs border border-border space-y-1">
                  <p className="text-muted-foreground">
                    Current Slot: <strong className="text-foreground">{transferringEnrollment.currentSlotDays} • {transferringEnrollment.currentSlotTime} ({transferringEnrollment.currentRoomName})</strong>
                  </p>
                </div>

                {/* Available Alternatives */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-foreground">
                    Select Target Timing Slot:
                  </label>
                  {alternativeSlotsForTransfer.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic p-3 bg-muted/40 rounded-xl">
                      No other timing slots found for this course.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {alternativeSlotsForTransfer.map((alt) => {
                        const isFull = alt.summary.status === 'FULL' || alt.summary.availableSeats <= 0
                        const isSelected = targetSlotAssignmentId === alt.assignmentId

                        return (
                          <label
                            key={alt.assignmentId}
                            className={`flex cursor-pointer items-center justify-between rounded-xl border p-2.5 text-xs transition ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-100/80 dark:bg-indigo-950/60 font-semibold'
                                : isFull
                                ? 'border-border/40 bg-muted/30 opacity-60 cursor-not-allowed'
                                : 'border-border bg-card hover:border-indigo-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="radio"
                                name="targetSlot"
                                value={alt.assignmentId}
                                disabled={isFull}
                                checked={isSelected}
                                onChange={() => setTargetSlotAssignmentId(alt.assignmentId)}
                                className="text-indigo-600 focus:ring-indigo-500"
                              />
                              <div>
                                <span className="font-bold text-foreground">{alt.days} • {alt.timeRangeFormatted}</span>
                                <span className="text-muted-foreground text-[11px] block">{alt.roomName}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  isFull
                                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                }`}
                              >
                                {isFull ? 'FULL (0 Free)' : `${alt.summary.availableSeats} of ${alt.summary.roomCapacity} Free`}
                              </span>
                              <span className="block text-[10px] text-muted-foreground mt-0.5 font-medium">
                                {alt.summary.totalEnrolled} Enrolled
                              </span>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Status Message */}
                {transferMessage && (
                  <div
                    className={`rounded-xl p-2.5 text-xs font-semibold flex items-center gap-1.5 ${
                      transferMessage.success
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                    }`}
                  >
                    {transferMessage.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                    <span>{transferMessage.text}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    disabled={!targetSlotAssignmentId || isTransferring}
                    onClick={handleConfirmTransfer}
                    className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isTransferring ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        Transferring...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={13} />
                        Confirm Move to Selected Slot
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTransferringEnrollment(null)
                      setTransferMessage(null)
                    }}
                    className="rounded-xl border border-border px-3 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Drawer Actions */}
            <div className="border-t border-border pt-4 flex gap-3">
              {activeDrawerSlot.seatSummary.availableSeats > 0 ? (
                <Link
                  href={baseEnrollUrl}
                  className="flex-1 rounded-2xl bg-indigo-600 px-4 py-3 text-center text-xs font-bold text-white hover:bg-indigo-700 transition shadow-xs"
                >
                  + Enroll Student in this Slot
                </Link>
              ) : (
                <div className="flex-1 rounded-2xl bg-muted px-4 py-3 text-center text-xs font-semibold text-muted-foreground">
                  Slot Full (0 Seats Free)
                </div>
              )}
              <button
                type="button"
                onClick={() => setSelectedCellSlotId(null)}
                className="rounded-2xl border border-border px-4 py-3 text-xs font-semibold text-foreground hover:bg-muted transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
