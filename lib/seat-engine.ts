// lib/seat-engine.ts

export type SeatStatus = 'AVAILABLE' | 'ALMOST_FULL' | 'FULL'

export interface EnrollmentLite {
  id?: string
  studentId?: string
  joiningDate?: Date | string
  endDate?: Date | string | null
  status?: string
  student?: {
    id: string
    name: string
    fatherName?: string
    phone?: string
    studentId?: string
  }
}

export interface CourseAssignmentLite {
  id: string
  courseId: string
  slotId?: string
  course: {
    id?: string
    name: string
    durationMonths?: number
    baseFee?: number | any
  }
  teacher?: {
    id: string
    firstName: string | null
    lastName: string | null
  } | null
  enrollments?: EnrollmentLite[]
}

export interface SlotWithRoomAndCourses {
  id: string
  roomId: string
  startTime: Date | string
  endTime: Date | string
  days: string
  room: {
    id?: string
    name: string
    capacity: number
  }
  courses?: CourseAssignmentLite[]
}

export interface SlotSeatSummary {
  slotId: string
  roomName: string
  roomCapacity: number
  totalEnrolled: number
  availableSeats: number
  occupancyPercent: number
  status: SeatStatus
  nextVacancyDate: Date | null
  days: string
  timeRangeFormatted: string
  assignmentsCount: number
}

/**
 * Checks whether an enrollment status occupies a physical seat.
 * Both ACTIVE and PENDING_COMPLETION students physically occupy a seat in the classroom.
 */
export function isOccupyingSeat(status?: string): boolean {
  if (!status) return true // default active assumption if not given
  const normalized = status.toUpperCase()
  return normalized === 'ACTIVE' || normalized === 'PENDING_COMPLETION'
}

/**
 * Calculates the earliest upcoming graduation / course end date in the future for a slot.
 */
export function getEarliestGraduationDate(
  enrollments: Array<{ endDate?: Date | string | null; status?: string }>
): Date | null {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const futureEndDates = enrollments
    .filter((e) => isOccupyingSeat(e.status) && e.endDate)
    .map((e) => new Date(e.endDate!))
    .filter((d) => !isNaN(d.getTime()) && d >= today)
    .sort((a, b) => a.getTime() - b.getTime())

  return futureEndDates.length > 0 ? futureEndDates[0] : null
}

/**
 * Computes a standardized seat summary for a given slot.
 */
export function getSlotSeatSummary(
  roomCapacity: number,
  allEnrollmentsInSlot: Array<{ endDate?: Date | string | null; status?: string; student?: any }>,
  slotDetails?: { id?: string; roomName?: string; days?: string; startTime?: Date | string; endTime?: Date | string; assignmentsCount?: number }
): SlotSeatSummary {
  const activeOccupants = allEnrollmentsInSlot.filter((e) => isOccupyingSeat(e.status))
  const totalEnrolled = activeOccupants.length
  const availableSeats = Math.max(0, roomCapacity - totalEnrolled)
  const occupancyPercent = roomCapacity > 0 ? Math.min(100, Math.round((totalEnrolled / roomCapacity) * 100)) : 100

  let status: SeatStatus = 'AVAILABLE'
  if (availableSeats === 0) {
    status = 'FULL'
  } else if (availableSeats <= 2) {
    status = 'ALMOST_FULL'
  }

  const nextVacancyDate = getEarliestGraduationDate(activeOccupants)

  let timeRangeFormatted = ''
  if (slotDetails?.startTime && slotDetails?.endTime) {
    const start = new Date(slotDetails.startTime)
    const end = new Date(slotDetails.endTime)
    timeRangeFormatted = `${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })} - ${end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })}`
  }

  return {
    slotId: slotDetails?.id || '',
    roomName: slotDetails?.roomName || '',
    roomCapacity,
    totalEnrolled,
    availableSeats,
    occupancyPercent,
    status,
    nextVacancyDate,
    days: slotDetails?.days || '',
    timeRangeFormatted,
    assignmentsCount: slotDetails?.assignmentsCount || 1
  }
}

/**
 * Formats time from Date or string into localized time zone (Asia/Karachi).
 */
export function formatSlotTime(time: Date | string): string {
  const d = new Date(time)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Karachi'
  })
}

/**
 * Formats a time range (startTime -> endTime).
 */
export function formatSlotTimeRange(startTime: Date | string, endTime: Date | string): string {
  return `${formatSlotTime(startTime)} - ${formatSlotTime(endTime)}`
}
