'use client'

import { useState, useMemo } from 'react'
import { Search, ChevronDown, ChevronUp, Clock, MapPin, Users, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

type AttendanceClass = {
 id: string
 course: { name: string }
 slot: { 
 startTime: Date
 endTime: Date
 days: string
 room: { name: string }
 }
 teacher?: { firstName: string | null; lastName: string | null } | null
 enrollments: any[]
 presentCount: number
 totalEnrolled: number
 isMarked: boolean
}

type Course = {
 id: string
 name: string
 classes: AttendanceClass[]
}

type Props = {
 courses: Course[]
}

export function AttendanceFilters({ courses }: Props) {
 const [searchQuery, setSearchQuery] = useState('')
 const [searchFilter, setSearchFilter] = useState<'courseName' | 'teacher'>('courseName')
 const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set())

 // Filter courses based on search
 const filteredCourses = useMemo(() => {
 if (!searchQuery.trim()) return courses

 return courses
 .map(course => {
 let filteredClasses = course.classes

 if (searchFilter === 'courseName') {
 // Filter by course name
 if (!course.name.toLowerCase().includes(searchQuery.toLowerCase())) {
 return null
 }
 } else if (searchFilter === 'teacher') {
 // Filter classes by teacher
 filteredClasses = course.classes.filter(cls => {
 const teacherName = `${cls.teacher?.firstName || ''} ${cls.teacher?.lastName || ''}`.trim()
 return teacherName.toLowerCase().includes(searchQuery.toLowerCase())
 })

 if (filteredClasses.length === 0) {
 return null
 }
 }

 return {
 ...course,
 classes: filteredClasses
 }
 })
 .filter((course): course is Course => course !== null)
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

 // Auto-expand courses on search
 const shouldAutoExpand = searchQuery.trim().length > 0

 return (
 <div className="space-y-6">
 {/* Search Bar and Filters */}
 <div className="bg-card border border-border rounded-lg p-6">
 <div className="flex gap-3 flex-col md:flex-row md:items-end">
 <div className="flex-1">
 <label className="block text-sm font-medium text-foreground mb-2">Search Classes</label>
 <div className="relative">
 <Search className="absolute left-3 top-3 text-muted-foreground " size={18} />
 <input
 type="text"
 placeholder={`Search by ${searchFilter === 'courseName' ? 'course name' : 'teacher name'}...`}
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
 />
 </div>
 </div>

 <div className="flex gap-2">
 <button
 onClick={() => setSearchFilter('courseName')}
 className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
 searchFilter === 'courseName'
 ? 'bg-blue-600 text-white'
 : 'bg-muted text-foreground hover:bg-gray-300 '
 }`}
 >
 Course Name
 </button>
 <button
 onClick={() => setSearchFilter('teacher')}
 className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
 searchFilter === 'teacher'
 ? 'bg-blue-600 text-white'
 : 'bg-muted text-foreground hover:bg-gray-300 '
 }`}
 >
 Teacher
 </button>
 </div>
 </div>
 </div>

 {/* Courses with Toggle */}
 <div className="space-y-4">
 {filteredCourses.length > 0 ? (
 filteredCourses.map((course) => (
 <div key={course.id} className="bg-card border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
 {/* Course Header with Toggle */}
 <button
 onClick={() => toggleCourse(course.id)}
 className="w-full px-6 py-4 flex justify-between items-start hover:bg-muted transition-colors border-b border-gray-100 "
 >
 <div className="flex-1 text-left">
 <h2 className="text-lg font-bold text-foreground ">{course.name}</h2>
 <p className="text-sm text-muted-foreground mt-1">
 Total Slots: {course.classes.length}
 </p>
 </div>
 <div className="flex items-center gap-4">
 <div className="p-2 hover:bg-muted rounded-lg transition-colors">
 {expandedCourses.has(course.id) || shouldAutoExpand ? (
 <ChevronUp size={20} className="text-muted-foreground " />
 ) : (
 <ChevronDown size={20} className="text-muted-foreground " />
 )}
 </div>
 </div>
 </button>

 {/* Course Slots - Show when expanded or on search */}
 {(expandedCourses.has(course.id) || shouldAutoExpand) && (
 <div className="p-6 border-t border-gray-100 ">
 {course.classes.length > 0 ? (
 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
 {course.classes
 .sort((a, b) => {
 const timeA = new Date(a.slot.startTime).getTime()
 const timeB = new Date(b.slot.startTime).getTime()
 return timeA - timeB
 })
 .map((cls) => (
 <div
 key={cls.id}
 className={`p-5 rounded-lg border transition-all ${
 cls.isMarked
 ? 'bg-card border-green-200 dark:border-green-900/50 hover:border-green-400 dark:hover:border-green-700 hover:shadow-md'
 : 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900/40 hover:border-yellow-400 dark:hover:border-yellow-700 hover:shadow-md'
 }`}
 >
 {/* Header with Status */}
 <div className="flex justify-between items-start mb-3">
 <div className="flex-1">
 <p className="text-sm text-muted-foreground ">{cls.slot.days}</p>
 <p className="text-xs text-muted-foreground ">
 {new Date(cls.slot.startTime).toLocaleTimeString('en-US', {
 hour: 'numeric',
 minute: '2-digit',
 hour12: true,
 timeZone: 'Asia/Karachi'
 })}
 {' - '}
 {new Date(cls.slot.endTime).toLocaleTimeString('en-US', {
 hour: 'numeric',
 minute: '2-digit',
 hour12: true,
 timeZone: 'Asia/Karachi'
 })}
 </p>
 </div>
 {cls.isMarked ? (
 <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/40 rounded text-xs font-medium text-green-800 dark:text-green-300">
 <CheckCircle2 size={12} />
 Marked
 </div>
 ) : (
 <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/40 rounded text-xs font-medium text-yellow-800 dark:text-yellow-300">
 <AlertCircle size={12} />
 Not Marked
 </div>
 )}
 </div>

 {/* Room Info */}
 <div className="text-xs text-muted-foreground mb-3 space-y-1">
 <p className="flex items-center gap-2">
 <MapPin size={12} /> {cls.slot.room.name}
 </p>
 <p className="flex items-center gap-2">
 👨‍🏫 {cls.teacher?.firstName || 'No Teacher'} {cls.teacher?.lastName || ''}
 </p>
 </div>

 {/* Attendance Summary Card */}
 <div className={`p-3 rounded-lg mb-4 ${
 cls.isMarked 
 ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50' 
 : 'bg-muted border border-gray-300 '
 }`}>
 {cls.isMarked ? (
 <div>
 <div className="text-sm font-bold text-foreground mb-2">Today's Attendance</div>
 <div className="flex items-baseline gap-2">
 <div className="text-2xl font-bold text-green-600 dark:text-green-300">{cls.presentCount}</div>
 <div className="text-sm text-muted-foreground ">out of {cls.totalEnrolled} present</div>
 </div>
 <div className="mt-2 w-full bg-muted rounded-full h-2 overflow-hidden">
 <div 
 className="h-full bg-green-50 dark:bg-green-950/400 rounded-full" 
 style={{ width: `${cls.totalEnrolled > 0 ? (cls.presentCount / cls.totalEnrolled) * 100 : 0}%` }}
 />
 </div>
 </div>
 ) : (
 <div className="text-sm text-muted-foreground font-medium">
 📋 Attendance is not marked yet
 </div>
 )}
 </div>

 {/* Students Info */}
 <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 pb-4 border-b border-border ">
 <Users size={14} />
 <span>{cls.totalEnrolled} Students Enrolled</span>
 </div>

 {/* Action Button */}
 <Link
 href={`/admin/attendance/${cls.id}`}
 className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
 >
 <Users size={14} />
 {cls.isMarked ? 'View Attendance' : 'Mark Attendance'}
 </Link>
 </div>
 ))}
 </div>
 ) : (
 <div className="text-center py-8 text-muted-foreground">
 <p>No slots match your search criteria.</p>
 </div>
 )}
 </div>
 )}
 </div>
 ))
 ) : (
 <div className="text-center py-20 bg-card border border-dashed border-border rounded-xl">
 <p className="text-muted-foreground ">
 {searchQuery.trim() ? 'No courses match your search.' : 'No courses found.'}
 </p>
 </div>
 )}
 </div>
 </div>
 )
}
