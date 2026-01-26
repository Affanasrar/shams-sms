// app/admin/schedule/management-panel.tsx
'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import {
  Settings,
  Building2,
  BookOpen,
  Clock,
  UserCheck,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react'
import {
  editRoom,
  deleteRoom,
  editCourse,
  deleteCourse,
  editSlot,
  deleteSlot,
  changeTeacherForm,
  deleteAssignmentForm
} from '@/app/actions/settings'
import { FeeType } from '@prisma/client'

type ActionState = {
  success: boolean
  message?: string
  error?: string
}

type CourseWithAssignments = {
  id: string
  name: string
  durationMonths: number
  baseFee: any // Decimal
  feeType: FeeType
  slotAssignments: {
    id: string
    course: { name: string; durationMonths: number }
    slot: {
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

const initialState: ActionState = { success: false }

type Props = {
  rooms: any[]
  courses: any[]
  slots: any[]
  teachers: any[]
}

export function ManagementPanel({ rooms, courses, slots, teachers }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'rooms' | 'courses' | 'slots' | 'assignments'>('rooms')

  // Action states
  const [editRoomState, editRoomAction, editRoomPending] = useActionState<ActionState, FormData>(editRoom, initialState)
  const [deleteRoomState, deleteRoomAction, deleteRoomPending] = useActionState<ActionState, FormData>(deleteRoom, initialState)

  const [editCourseState, editCourseAction, editCoursePending] = useActionState<ActionState, FormData>(editCourse, initialState)
  const [deleteCourseState, deleteCourseAction, deleteCoursePending] = useActionState<ActionState, FormData>(deleteCourse, initialState)

  const [editSlotState, editSlotAction, editSlotPending] = useActionState<ActionState, FormData>(editSlot, initialState)
  const [deleteSlotState, deleteSlotAction, deleteSlotPending] = useActionState<ActionState, FormData>(deleteSlot, initialState)

  const [changeTeacherState, changeTeacherAction, changeTeacherPending] = useActionState<ActionState, FormData>(
    async (prevState, formData) => {
      try {
        await changeTeacherForm(formData)
        return { success: true, message: "Teacher changed successfully" }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    },
    initialState
  )
  // For delete, we'll handle it directly without useActionState since it doesn't return state
  const handleDeleteAssignment = async (formData: FormData) => {
    try {
      await deleteAssignmentForm(formData)
      // Refresh the page or update state
      window.location.reload()
    } catch (error) {
      alert('Failed to delete assignment: ' + error)
    }
  }

  const [editingItem, setEditingItem] = useState<any>(null)

  const tabs = [
    { id: 'rooms', label: 'Rooms', icon: Building2 },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'slots', label: 'Slots', icon: Clock },
    { id: 'assignments', label: 'Assignments', icon: UserCheck }
  ]

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Settings size={16} />
        Manage
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">Management Panel</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex border-b">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {activeTab === 'rooms' && (
                <RoomManagement
                  rooms={rooms}
                  editRoomState={editRoomState}
                  editRoomAction={editRoomAction}
                  editRoomPending={editRoomPending}
                  deleteRoomState={deleteRoomState}
                  deleteRoomAction={deleteRoomAction}
                  deleteRoomPending={deleteRoomPending}
                  editingItem={editingItem}
                  setEditingItem={setEditingItem}
                />
              )}

              {activeTab === 'courses' && (
                <CourseManagement
                  courses={courses}
                  editCourseState={editCourseState}
                  editCourseAction={editCourseAction}
                  editCoursePending={editCoursePending}
                  deleteCourseState={deleteCourseState}
                  deleteCourseAction={deleteCourseAction}
                  deleteCoursePending={deleteCoursePending}
                  editingItem={editingItem}
                  setEditingItem={setEditingItem}
                />
              )}

              {activeTab === 'slots' && (
                <SlotManagement
                  slots={slots}
                  rooms={rooms}
                  editSlotState={editSlotState}
                  editSlotAction={editSlotAction}
                  editSlotPending={editSlotPending}
                  deleteSlotState={deleteSlotState}
                  deleteSlotAction={deleteSlotAction}
                  deleteSlotPending={deleteSlotPending}
                  editingItem={editingItem}
                  setEditingItem={setEditingItem}
                />
              )}

                <AssignmentManagement
                  courses={courses}
                  slots={slots}
                  teachers={teachers}
                  changeTeacherState={changeTeacherState}
                  changeTeacherAction={changeTeacherAction}
                  changeTeacherPending={changeTeacherPending}
                  handleDeleteAssignment={handleDeleteAssignment}
                  editingItem={editingItem}
                  setEditingItem={setEditingItem}
                />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Room Management Component
function RoomManagement({ rooms, editRoomState, editRoomAction, editRoomPending, deleteRoomState, deleteRoomAction, deleteRoomPending, editingItem, setEditingItem }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Existing Rooms</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {rooms.map((room: any) => (
            <div key={room.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <span className="font-medium">{room.name}</span>
                <span className="text-sm text-gray-500 ml-2">(Capacity: {room.capacity})</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingItem(room)}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  title="Edit Room"
                >
                  <Edit size={16} />
                </button>
                <form action={deleteRoomAction} className="inline">
                  <input type="hidden" name="id" value={room.id} />
                  <button
                    type="submit"
                    disabled={deleteRoomPending}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                    title="Delete Room"
                    onClick={(e) => {
                      if (!confirm('Are you sure you want to delete this room?')) {
                        e.preventDefault()
                      }
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editingItem && editingItem.name && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Edit Room</h3>
          <form action={editRoomAction} className="space-y-4">
            <input type="hidden" name="id" value={editingItem.id} />
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Name</label>
                <input
                  name="name"
                  type="text"
                  defaultValue={editingItem.name}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                <input
                  name="capacity"
                  type="number"
                  defaultValue={editingItem.capacity}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={editRoomPending}
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {editRoomPending ? 'Updating...' : 'Update Room'}
              </button>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
            <StatusAlert state={editRoomState} />
          </form>
        </div>
      )}
    </div>
  )
}

// Course Management Component
function CourseManagement({ courses, editCourseState, editCourseAction, editCoursePending, deleteCourseState, deleteCourseAction, deleteCoursePending, editingItem, setEditingItem }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Existing Courses</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {courses.map((course: any) => (
            <div key={course.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <span className="font-medium">{course.name}</span>
                <span className="text-sm text-gray-500 ml-2">
                  ({course.durationMonths} months, PKR {course.baseFee})
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingItem(course)}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  title="Edit Course"
                >
                  <Edit size={16} />
                </button>
                <form action={deleteCourseAction} className="inline">
                  <input type="hidden" name="id" value={course.id} />
                  <button
                    type="submit"
                    disabled={deleteCoursePending}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                    title="Delete Course"
                    onClick={(e) => {
                      if (!confirm('Are you sure you want to delete this course?')) {
                        e.preventDefault()
                      }
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editingItem && editingItem.name && editingItem.baseFee !== undefined && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Edit Course</h3>
          <form action={editCourseAction} className="space-y-4">
            <input type="hidden" name="id" value={editingItem.id} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
              <input
                name="name"
                type="text"
                defaultValue={editingItem.name}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fee (PKR)</label>
                <input
                  name="fee"
                  type="number"
                  defaultValue={editingItem.baseFee}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Months</label>
                <input
                  name="duration"
                  type="number"
                  defaultValue={editingItem.durationMonths}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={editCoursePending}
                className="bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 disabled:opacity-50"
              >
                {editCoursePending ? 'Updating...' : 'Update Course'}
              </button>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
            <StatusAlert state={editCourseState} />
          </form>
        </div>
      )}
    </div>
  )
}

// Slot Management Component
function SlotManagement({ slots, rooms, editSlotState, editSlotAction, editSlotPending, deleteSlotState, deleteSlotAction, deleteSlotPending, editingItem, setEditingItem }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Existing Slots</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {slots.map((slot: any) => (
            <div key={slot.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <span className="font-medium">{slot.room.name}</span>
                <span className="text-sm text-gray-500 ml-2">
                  {new Date(slot.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })} - {new Date(slot.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })}
                </span>
                <span className="text-sm text-gray-500 ml-2">({slot.days})</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingItem(slot)}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  title="Edit Slot"
                >
                  <Edit size={16} />
                </button>
                <form action={deleteSlotAction} className="inline">
                  <input type="hidden" name="id" value={slot.id} />
                  <button
                    type="submit"
                    disabled={deleteSlotPending}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                    title="Delete Slot"
                    onClick={(e) => {
                      if (!confirm('Are you sure you want to delete this slot?')) {
                        e.preventDefault()
                      }
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editingItem && editingItem.startTime && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Edit Slot</h3>
          <form action={editSlotAction} className="space-y-4">
            <input type="hidden" name="id" value={editingItem.id} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
              <select
                name="roomId"
                defaultValue={editingItem.roomId}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {rooms.map((room: any) => (
                  <option key={room.id} value={room.id}>
                    {room.name} (Capacity: {room.capacity})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Days</label>
              <input
                name="days"
                type="text"
                defaultValue={editingItem.days}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  name="startTime"
                  type="time"
                  defaultValue={new Date(editingItem.startTime).toTimeString().slice(0, 5)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  name="endTime"
                  type="time"
                  defaultValue={new Date(editingItem.endTime).toTimeString().slice(0, 5)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={editSlotPending}
                className="bg-amber-600 text-white py-2 px-4 rounded-md hover:bg-amber-700 disabled:opacity-50"
              >
                {editSlotPending ? 'Updating...' : 'Update Slot'}
              </button>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
            <StatusAlert state={editSlotState} />
          </form>
        </div>
      )}
    </div>
  )
}

// Assignment Management Component
function AssignmentManagement({ courses, slots, teachers, changeTeacherState, changeTeacherAction, changeTeacherPending, handleDeleteAssignment, editingItem, setEditingItem }: {
  courses: CourseWithAssignments[]
  slots: any[]
  teachers: any[]
  changeTeacherState: ActionState
  changeTeacherAction: any
  changeTeacherPending: boolean
  handleDeleteAssignment: any
  editingItem: any
  setEditingItem: any
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Existing Assignments</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {courses.length === 0 || courses.every(course => !course.slotAssignments || course.slotAssignments.length === 0) ? (
            <div className="text-center py-8 text-gray-500">
              <p>No assignments found.</p>
              <p className="text-sm">Create courses and assign them to time slots first.</p>
            </div>
          ) : (
            courses.map((course: CourseWithAssignments) =>
              course.slotAssignments?.map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <span className="font-medium">{course.name}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      {assignment.slot.room.name} • {assignment.teacher?.firstName || 'No Teacher'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingItem({ ...assignment, courseName: course.name })}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title="Change Teacher"
                    >
                      <Edit size={16} />
                    </button>
                    <form action={handleDeleteAssignment} className="inline">
                      <input type="hidden" name="id" value={assignment.id} />
                      <button
                        type="submit"
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Delete Assignment"
                        onClick={(e) => {
                          if (!confirm('Are you sure you want to delete this assignment?')) {
                            e.preventDefault()
                          }
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </form>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>

      {editingItem && editingItem.courseName && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Change Teacher for {editingItem.courseName}</h3>
          <form action={changeTeacherAction} className="space-y-4">
            <input type="hidden" name="assignmentId" value={editingItem.id} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Teacher</label>
              <select
                name="teacherId"
                defaultValue={editingItem.teacherId || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">-- Choose Teacher --</option>
                {teachers.map((teacher: any) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.firstName} {teacher.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={changeTeacherPending}
                className="bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {changeTeacherPending ? 'Changing...' : 'Change Teacher'}
              </button>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
            <StatusAlert state={changeTeacherState} />
          </form>
        </div>
      )}
    </div>
  )
}

// Status Alert Component
function StatusAlert({ state }: { state: ActionState }) {
  if (!state.message && !state.error) return null

  return (
    <div className={`p-3 rounded-md text-sm ${state.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
      {state.success ? <CheckCircle2 size={16} className="inline mr-2" /> : <AlertCircle size={16} className="inline mr-2" />}
      {state.message || state.error}
    </div>
  )
}