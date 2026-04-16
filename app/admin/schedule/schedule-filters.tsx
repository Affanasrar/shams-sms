'use client'

import { useState, useMemo } from 'react'
import { Search, ChevronDown, ChevronUp } from 'lucide-react'
import { SlotCard } from './slot-card'
import { FeeType } from '@prisma/client'

type CourseWithAssignments = {
  id: string
  name: string
  durationMonths: number
  baseFee: any
  feeType: FeeType
  slotAssignments: {
    id: string
    course: { name: string; durationMonths: number }
    slot: {
      id: string
      startTime: Date
      endTime: Date
      days: string
      room: { name: string; capacity: number; id: string }
    }
    enrollments: {
      endDate: Date | null
      student: {
        id: string
        name: string
        phone: string
        fatherName: string
      }
    }[]
    teacher?: { id: string; firstName: string | null; lastName: string | null } | null
  }[]
}

type Props = {
  courses: CourseWithAssignments[]
  teachers: any[]
  slots: any[]
}

export function ScheduleFilters({ courses, teachers, slots }: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFilter, setSearchFilter] = useState<'courseName' | 'time' | 'teacher'>('courseName')
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'course' | 'room' | 'room-timing'>('course')
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set())
  const [expandedTimings, setExpandedTimings] = useState<Set<string>>(new Set())

  // Compute occupancy per slot across all assignments
  const slotOccupancyMap = useMemo(() => {
    const map = new Map<string, number>()
    courses.forEach(course => {
      course.slotAssignments.forEach(assignment => {
        const slotId = assignment.slot?.id || ''
        const count = (assignment.enrollments || []).length
        if (!slotId) return
        map.set(slotId, (map.get(slotId) || 0) + count)
      })
    })
    return map
  }, [courses])

  // Filter courses and slots based on search
  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return courses

    return courses
      .map(course => {
        let filteredAssignments = course.slotAssignments

        if (searchFilter === 'courseName') {
          // Filter by course name
          if (!course.name.toLowerCase().includes(searchQuery.toLowerCase())) {
            return null
          }
        } else if (searchFilter === 'time') {
          // Filter assignments by time
          filteredAssignments = course.slotAssignments.filter(assignment => {
            const startTime = new Date(assignment.slot.startTime).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
              timeZone: 'Asia/Karachi'
            })
            const endTime = new Date(assignment.slot.endTime).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
              timeZone: 'Asia/Karachi'
            })
            const timeRange = `${startTime} - ${endTime}`
            return timeRange.toLowerCase().includes(searchQuery.toLowerCase())
          })

          if (filteredAssignments.length === 0) {
            return null
          }
        } else if (searchFilter === 'teacher') {
          // Filter assignments by teacher
          filteredAssignments = course.slotAssignments.filter(assignment => {
            const teacherName = `${assignment.teacher?.firstName || ''} ${assignment.teacher?.lastName || ''}`.trim()
            return teacherName.toLowerCase().includes(searchQuery.toLowerCase())
          })

          if (filteredAssignments.length === 0) {
            return null
          }
        }

        return {
          ...course,
          slotAssignments: filteredAssignments
        }
      })
      .filter((course): course is CourseWithAssignments => course !== null)
  }, [courses, searchQuery, searchFilter])

  const toggleCourse = (courseId: string) => {
    const newExpanded = new Set(expandedCourses)
    if (newExpanded.has(courseId)) {
      newExpanded.delete(courseId)
    } else {
      newExpanded.add(courseId)
    }
    setExpandedCourses(newExpanded)
  }

  const toggleRoom = (roomId: string) => {
    const newExpanded = new Set(expandedRooms)
    if (newExpanded.has(roomId)) {
      newExpanded.delete(roomId)
    } else {
      newExpanded.add(roomId)
    }
    setExpandedRooms(newExpanded)
  }

  const toggleTiming = (timingKey: string) => {
    const newExpanded = new Set(expandedTimings)
    if (newExpanded.has(timingKey)) {
      newExpanded.delete(timingKey)
    } else {
      newExpanded.add(timingKey)
    }
    setExpandedTimings(newExpanded)
  }

  // Group assignments by room
  const roomGroupedData = useMemo(() => {
    const roomMap = new Map<string, {
      id: string
      name: string
      capacity: number
      assignments: Array<{
        id: string
        course: { name: string; durationMonths: number }
        slot: {
          id: string
          startTime: Date
          endTime: Date
          days: string
          room: { name: string; capacity: number; id: string }
        }
        enrollments: Array<{
          endDate: Date | null
          student: {
            id: string
            name: string
            phone: string
            fatherName: string
          }
        }>
        teacher?: { id: string; firstName: string | null; lastName: string | null } | null
      }>
    }>()

    filteredCourses.forEach(course => {
      course.slotAssignments.forEach(assignment => {
        const roomId = assignment.slot.room.id
        if (!roomMap.has(roomId)) {
          roomMap.set(roomId, {
            id: roomId,
            name: assignment.slot.room.name,
            capacity: assignment.slot.room.capacity,
            assignments: []
          })
        }
        roomMap.get(roomId)!.assignments.push(assignment)
      })
    })

    // Sort assignments by time within each room
    roomMap.forEach(room => {
      room.assignments.sort((a, b) => {
        const timeA = new Date(a.slot.startTime).getTime()
        const timeB = new Date(b.slot.startTime).getTime()
        return timeA - timeB
      })
    })

    return Array.from(roomMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [filteredCourses])

  // Group assignments by room and timing
  const roomTimingGroupedData = useMemo(() => {
    const roomMap = new Map<string, {
      id: string
      name: string
      capacity: number
      timings: Array<{
        key: string
        startTime: Date
        endTime: Date
        days: string
        timeDisplay: string
        studentCount: number
        seatsAvailable: number
        assignments: Array<{
          id: string
          course: { name: string; durationMonths: number }
          slot: {
            id: string
            startTime: Date
            endTime: Date
            days: string
            room: { name: string; capacity: number; id: string }
          }
          enrollments: Array<{
            endDate: Date | null
            student: {
              id: string
              name: string
              phone: string
              fatherName: string
            }
          }>
          teacher?: { id: string; firstName: string | null; lastName: string | null } | null
        }>
      }>
    }>()

    filteredCourses.forEach(course => {
      course.slotAssignments.forEach(assignment => {
        const roomId = assignment.slot.room.id
        if (!roomMap.has(roomId)) {
          roomMap.set(roomId, {
            id: roomId,
            name: assignment.slot.room.name,
            capacity: assignment.slot.room.capacity,
            timings: []
          })
        }

        const room = roomMap.get(roomId)!
        const timeDisplay = `${new Date(assignment.slot.startTime).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZone: 'Asia/Karachi'
        })} - ${new Date(assignment.slot.endTime).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZone: 'Asia/Karachi'
        })}`
        
        const timingKey = `${roomId}-${assignment.slot.days}-${timeDisplay}`
        
        let timing = room.timings.find(t => t.key === timingKey)
        if (!timing) {
          timing = {
            key: timingKey,
            startTime: assignment.slot.startTime,
            endTime: assignment.slot.endTime,
            days: assignment.slot.days,
            timeDisplay,
            studentCount: 0,
            seatsAvailable: assignment.slot.room.capacity,
            assignments: []
          }
          room.timings.push(timing)
        }
        
        timing.assignments.push(assignment)
        timing.studentCount += (assignment.enrollments || []).length
        timing.seatsAvailable = Math.max(0, assignment.slot.room.capacity - timing.studentCount)
      })
    })

    // Sort timings within each room by start time, then sort rooms
    roomMap.forEach(room => {
      room.timings.sort((a, b) => {
        const timeA = new Date(a.startTime).getTime()
        const timeB = new Date(b.startTime).getTime()
        return timeA - timeB
      })
    })

    return Array.from(roomMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [filteredCourses])

  // Auto-expand courses on search
  const shouldAutoExpand = searchQuery.trim().length > 0

  return (
    <div className="space-y-6">
      {/* Search Bar and Filters */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex gap-3 flex-col md:flex-row md:items-end md:justify-between">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Courses</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="text"
                placeholder={`Search by ${searchFilter === 'courseName' ? 'course name' : searchFilter === 'time' ? 'time' : 'teacher name'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 md:flex-row">
            <div className="flex gap-2">
              <button
                onClick={() => setSearchFilter('courseName')}
                className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap text-sm ${
                  searchFilter === 'courseName'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Course Name
              </button>
              <button
                onClick={() => setSearchFilter('time')}
                className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap text-sm ${
                  searchFilter === 'time'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Time
              </button>
              <button
                onClick={() => setSearchFilter('teacher')}
                className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap text-sm ${
                  searchFilter === 'teacher'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Teacher
              </button>
            </div>

            <div className="flex gap-2 border-l pl-4">
              <button
                onClick={() => setViewMode('course')}
                className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap text-sm ${
                  viewMode === 'course'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                By Course
              </button>
              <button
                onClick={() => setViewMode('room-timing')}
                className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap text-sm ${
                  viewMode === 'room-timing'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                By Room & Timing
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* View by Course */}
      {viewMode === 'course' && (
        <div className="space-y-4">
          {filteredCourses.length > 0 ? (
            filteredCourses.map((course) => (
              <div key={course.id} className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Course Header with Toggle */}
                <button
                  onClick={() => toggleCourse(course.id)}
                  className="w-full px-6 py-4 flex justify-between items-start hover:bg-gray-50 transition-colors border-b border-gray-100"
                >
                  <div className="flex-1 text-left">
                    <h2 className="text-lg font-bold text-gray-900">{course.name}</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Duration: {course.durationMonths} months • Fee: ${course.baseFee.toString()} ({course.feeType})
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm text-gray-600">
                      Total Slots: {course.slotAssignments.length}
                    </div>
                    <div className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                      {expandedCourses.has(course.id) || shouldAutoExpand ? (
                        <ChevronUp size={20} className="text-gray-600" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-600" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Course Slots - Show when expanded or on search */}
                {(expandedCourses.has(course.id) || shouldAutoExpand) && (
                  <div className="p-6 border-t border-gray-100">
                    {course.slotAssignments.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {course.slotAssignments
                          .sort((a, b) => {
                            const timeA = new Date(a.slot.startTime).getTime()
                            const timeB = new Date(b.slot.startTime).getTime()
                            return timeA - timeB
                          })
                          .map((assignment) => (
                          <SlotCard
                            key={assignment.id}
                            data={assignment}
                            teachers={teachers}
                            slotOccupancy={slotOccupancyMap.get((assignment as any).slot?.id)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>No slots match your search criteria.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-white border border-dashed rounded-xl">
              <p className="text-gray-500">
                {searchQuery.trim() ? 'No courses match your search.' : 'No courses found.'}
              </p>
              {!searchQuery.trim() && (
                <p className="text-sm">Create courses first, then assign them to time slots.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* View by Room */}
      {viewMode === 'room-timing' && (
        <div className="space-y-4">
          {roomTimingGroupedData.length > 0 ? (
            roomTimingGroupedData.map((room) => (
              <div key={room.id} className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Room Header */}
                <button
                  onClick={() => toggleRoom(room.id)}
                  className="w-full px-6 py-4 flex justify-between items-start hover:bg-gray-50 transition-colors border-b border-gray-100"
                >
                  <div className="flex-1 text-left">
                    <h2 className="text-lg font-bold text-gray-900">{room.name}</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Capacity: {room.capacity} students
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm text-gray-600">
                      Total Times: {room.timings.length}
                    </div>
                    <div className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                      {expandedRooms.has(room.id) ? (
                        <ChevronUp size={20} className="text-gray-600" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-600" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Timing Groups - Show when room expanded */}
                {expandedRooms.has(room.id) && (
                  <div className="border-t border-gray-100">
                    {room.timings.length > 0 ? (
                      room.timings.map((timing) => (
                        <div key={timing.key} className="border-b border-gray-100 last:border-b-0">
                          {/* Timing Header */}
                          <button
                            onClick={() => toggleTiming(timing.key)}
                            className="w-full px-6 py-3 flex justify-between items-center hover:bg-blue-50 transition-colors"
                          >
                            <div className="flex-1 text-left">
                              <h3 className="font-semibold text-gray-900">{timing.timeDisplay}</h3>
                              <p className="text-xs text-gray-500">{timing.days}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                {timing.assignments.length} course{timing.assignments.length !== 1 ? 's' : ''}
                              </span>
                              <span className={`text-xs font-medium text-white px-2 py-1 rounded ${timing.seatsAvailable > 0 ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                                {timing.studentCount} students • {timing.seatsAvailable} seats left
                              </span>
                              <div className="p-1">
                                {expandedTimings.has(timing.key) ? (
                                  <ChevronUp size={18} className="text-gray-600" />
                                ) : (
                                  <ChevronDown size={18} className="text-gray-600" />
                                )}
                              </div>
                            </div>
                          </button>

                          {/* Courses at this timing */}
                          {expandedTimings.has(timing.key) && (
                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                              {timing.assignments.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {timing.assignments.map((assignment) => (
                                    <SlotCard
                                      key={assignment.id}
                                      data={assignment}
                                      teachers={teachers}
                                      slotOccupancy={slotOccupancyMap.get((assignment as any).slot?.id)}
                                    />
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-4 text-gray-500">
                                  <p>No courses at this time.</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>No timings in this room.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-white border border-dashed rounded-xl">
              <p className="text-gray-500">
                {searchQuery.trim() ? 'No rooms match your search.' : 'No rooms with assignments found.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
