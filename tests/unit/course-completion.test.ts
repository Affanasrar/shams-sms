// tests/unit/course-completion.test.ts
import { describe, it, expect } from 'vitest'

type Enrollment = {
  id: string
  status: 'ACTIVE' | 'PENDING_COMPLETION' | 'COMPLETED' | 'DROPPED'
  endDate: Date
}

type Room = {
  id: string
  name: string
  capacity: number
}

// Function to check if enrollment should be marked as pending completion
function checkPendingCompletion(enrollment: Enrollment, now: Date): boolean {
  return enrollment.status === 'ACTIVE' && enrollment.endDate <= now
}

// Function to count occupied seats. PENDING_COMPLETION still occupies a seat, COMPLETED/DROPPED does not.
function getOccupiedSeats(enrollments: Enrollment[]): number {
  return enrollments.filter(
    (e) => e.status === 'ACTIVE' || e.status === 'PENDING_COMPLETION'
  ).length
}

describe('Course Completion and Seat Allocation Helpers', () => {
  describe('checkPendingCompletion', () => {
    it('should identify active enrollments that have expired', () => {
      const now = new Date('2026-07-21T12:00:00Z')
      const enrollment: Enrollment = {
        id: '1',
        status: 'ACTIVE',
        endDate: new Date('2026-07-20T12:00:00Z'), // expired
      }
      expect(checkPendingCompletion(enrollment, now)).toBe(true)
    })

    it('should ignore active enrollments that have not expired yet', () => {
      const now = new Date('2026-07-21T12:00:00Z')
      const enrollment: Enrollment = {
        id: '1',
        status: 'ACTIVE',
        endDate: new Date('2026-07-22T12:00:00Z'), // not expired
      }
      expect(checkPendingCompletion(enrollment, now)).toBe(false)
    })

    it('should ignore enrollments that are already completed', () => {
      const now = new Date('2026-07-21T12:00:00Z')
      const enrollment: Enrollment = {
        id: '1',
        status: 'COMPLETED',
        endDate: new Date('2026-07-20T12:00:00Z'), // expired but already completed
      }
      expect(checkPendingCompletion(enrollment, now)).toBe(false)
    })
  })

  describe('Seat Vacancy Calculations', () => {
    it('should count ACTIVE and PENDING_COMPLETION as occupying a seat', () => {
      const enrollments: Enrollment[] = [
        { id: '1', status: 'ACTIVE', endDate: new Date() },
        { id: '2', status: 'PENDING_COMPLETION', endDate: new Date() },
        { id: '3', status: 'COMPLETED', endDate: new Date() },
        { id: '4', status: 'DROPPED', endDate: new Date() },
      ]
      // 1 Active + 1 Pending Completion = 2 occupied seats
      expect(getOccupiedSeats(enrollments)).toBe(2)
    })

    it('should show 0 occupied seats if all enrollments are COMPLETED or DROPPED', () => {
      const enrollments: Enrollment[] = [
        { id: '1', status: 'COMPLETED', endDate: new Date() },
        { id: '2', status: 'DROPPED', endDate: new Date() },
      ]
      expect(getOccupiedSeats(enrollments)).toBe(0)
    })

    it('should correctly evaluate if room capacity is exceeded', () => {
      const room: Room = { id: 'room-1', name: 'Lab 1', capacity: 3 }
      
      const currentEnrollments: Enrollment[] = [
        { id: '1', status: 'ACTIVE', endDate: new Date() },
        { id: '2', status: 'PENDING_COMPLETION', endDate: new Date() }, // still occupies a seat!
      ]

      const occupied = getOccupiedSeats(currentEnrollments)
      expect(occupied).toBe(2)
      expect(occupied < room.capacity).toBe(true) // 2 < 3, slot has space

      // Add a completed one (doesn't occupy seat)
      currentEnrollments.push({ id: '3', status: 'COMPLETED', endDate: new Date() })
      expect(getOccupiedSeats(currentEnrollments)).toBe(2) // still 2

      // Add another active one
      currentEnrollments.push({ id: '4', status: 'ACTIVE', endDate: new Date() })
      expect(getOccupiedSeats(currentEnrollments)).toBe(3) // 3
      expect(getOccupiedSeats(currentEnrollments) >= room.capacity).toBe(true) // room full
    })
  })
})
