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
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Plus,
  Users,
  DollarSign,
  Sparkles,
  Search,
  Timer
} from 'lucide-react'
import {
  createRoom,
  editRoom,
  deleteRoom,
  createCourse,
  editCourse,
  deleteCourse,
  createSlot,
  editSlot,
  deleteSlot,
  assignCourseToSlot,
  changeTeacherForm,
  changeSlotRoom,
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
  baseFee: any
  feeType: FeeType
  slotAssignments: {
    id: string
    course: { name: string; durationMonths: number }
    slot: {
      id?: string
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
  coursesWithAssignments: any[]
  slots: any[]
  teachers: any[]
}

export function ManagementPanel({ rooms, courses, coursesWithAssignments, slots, teachers }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'rooms' | 'courses' | 'slots' | 'assignments'>('rooms')

  // Action states for creation
  const [createRoomState, createRoomAction, createRoomPending] = useActionState<ActionState, FormData>(createRoom, initialState)
  const [createCourseState, createCourseAction, createCoursePending] = useActionState<ActionState, FormData>(createCourse, initialState)
  const [createSlotState, createSlotAction, createSlotPending] = useActionState<ActionState, FormData>(createSlot, initialState)
  const [assignCourseState, assignCourseAction, assignCoursePending] = useActionState<ActionState, FormData>(assignCourseToSlot, initialState)

  // Action states for editing & deleting
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
        return { success: true, message: 'Teacher assignment updated successfully' }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    },
    initialState
  )

  const [changeRoomState, changeRoomAction, changeRoomPending] = useActionState<ActionState, FormData>(
    async (prevState, formData) => {
      try {
        await changeSlotRoom(formData)
        return { success: true, message: 'Room assignment updated successfully' }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    },
    initialState
  )

  const handleDeleteAssignment = async (formData: FormData) => {
    try {
      await deleteAssignmentForm(formData)
      window.location.reload()
    } catch (error) {
      alert('Failed to delete assignment: ' + error)
    }
  }

  const [editingItem, setEditingItem] = useState<any>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)

  const tabs = [
    { id: 'rooms', label: 'Rooms & Labs', icon: Building2, count: rooms.length },
    { id: 'courses', label: 'Courses', icon: BookOpen, count: courses.length },
    { id: 'slots', label: 'Time Slots', icon: Clock, count: slots.length },
    { id: 'assignments', label: 'Class Assignments', icon: UserCheck, count: coursesWithAssignments.length }
  ]

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2.5 text-xs sm:text-sm font-semibold text-foreground shadow-xs transition hover:bg-muted hover:text-foreground cursor-pointer"
      >
        <Settings size={15} className="text-muted-foreground" />
        <span>Manage Settings</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-3xl max-h-[85vh] my-auto flex flex-col rounded-[28px] border border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border p-5 bg-card shrink-0">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                  <Settings size={12} />
                  Schedule Setup
                </div>
                <h2 className="mt-1 text-lg font-bold text-foreground">Schedule Configuration Panel</h2>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false)
                  setEditingItem(null)
                  setIsAddingNew(false)
                }}
                className="rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Segmented Tab Navigation */}
            <div className="flex border-b border-border bg-muted/40 p-2 gap-1.5 overflow-x-auto shrink-0">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as any)
                      setEditingItem(null)
                      setIsAddingNew(false)
                    }}
                    className={`flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                      isActive
                        ? 'bg-card text-foreground shadow-xs font-bold'
                        : 'text-muted-foreground hover:bg-card/50 hover:text-foreground'
                    }`}
                  >
                    <tab.icon size={14} className={isActive ? 'text-indigo-600 dark:text-indigo-400' : ''} />
                    <span>{tab.label}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground font-bold">
                      {tab.count}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {activeTab === 'rooms' && (
                <RoomManagement
                  rooms={rooms}
                  createRoomState={createRoomState}
                  createRoomAction={createRoomAction}
                  createRoomPending={createRoomPending}
                  editRoomState={editRoomState}
                  editRoomAction={editRoomAction}
                  editRoomPending={editRoomPending}
                  deleteRoomAction={deleteRoomAction}
                  deleteRoomPending={deleteRoomPending}
                  editingItem={editingItem}
                  setEditingItem={setEditingItem}
                  isAddingNew={isAddingNew}
                  setIsAddingNew={setIsAddingNew}
                />
              )}

              {activeTab === 'courses' && (
                <CourseManagement
                  courses={courses}
                  createCourseState={createCourseState}
                  createCourseAction={createCourseAction}
                  createCoursePending={createCoursePending}
                  editCourseState={editCourseState}
                  editCourseAction={editCourseAction}
                  editCoursePending={editCoursePending}
                  deleteCourseAction={deleteCourseAction}
                  deleteCoursePending={deleteCoursePending}
                  editingItem={editingItem}
                  setEditingItem={setEditingItem}
                  isAddingNew={isAddingNew}
                  setIsAddingNew={setIsAddingNew}
                />
              )}

              {activeTab === 'slots' && (
                <SlotManagement
                  slots={slots}
                  rooms={rooms}
                  createSlotState={createSlotState}
                  createSlotAction={createSlotAction}
                  createSlotPending={createSlotPending}
                  editSlotState={editSlotState}
                  editSlotAction={editSlotAction}
                  editSlotPending={editSlotPending}
                  deleteSlotAction={deleteSlotAction}
                  deleteSlotPending={deleteSlotPending}
                  editingItem={editingItem}
                  setEditingItem={setEditingItem}
                  isAddingNew={isAddingNew}
                  setIsAddingNew={setIsAddingNew}
                />
              )}

              {activeTab === 'assignments' && (
                <AssignmentManagement
                  courses={coursesWithAssignments}
                  rawCourses={courses}
                  slots={slots}
                  rooms={rooms}
                  teachers={teachers}
                  assignCourseState={assignCourseState}
                  assignCourseAction={assignCourseAction}
                  assignCoursePending={assignCoursePending}
                  changeTeacherState={changeTeacherState}
                  changeTeacherAction={changeTeacherAction}
                  changeTeacherPending={changeTeacherPending}
                  changeRoomState={changeRoomState}
                  changeRoomAction={changeRoomAction}
                  changeRoomPending={changeRoomPending}
                  handleDeleteAssignment={handleDeleteAssignment}
                  editingItem={editingItem}
                  setEditingItem={setEditingItem}
                  isAddingNew={isAddingNew}
                  setIsAddingNew={setIsAddingNew}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Room Management Component
// ─────────────────────────────────────────────────────────────────────────────
function RoomManagement({
  rooms,
  createRoomState,
  createRoomAction,
  createRoomPending,
  editRoomState,
  editRoomAction,
  editRoomPending,
  deleteRoomAction,
  deleteRoomPending,
  editingItem,
  setEditingItem,
  isAddingNew,
  setIsAddingNew
}: any) {
  const [search, setSearch] = useState('')

  const filtered = rooms.filter((r: any) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={13} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rooms..."
            className="w-full rounded-xl border border-border bg-muted/50 py-1.5 pl-8 pr-3 text-xs text-foreground outline-none focus:border-indigo-500 focus:bg-card"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            setIsAddingNew(!isAddingNew)
            setEditingItem(null)
          }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition cursor-pointer shadow-xs"
        >
          <Plus size={14} />
          <span>{isAddingNew ? 'Close Form' : 'Add New Room'}</span>
        </button>
      </div>

      {/* Add New Room Form */}
      {isAddingNew && (
        <div className="rounded-2xl border-2 border-indigo-500/60 bg-indigo-50/20 dark:bg-indigo-950/20 p-4 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h4 className="font-bold text-foreground text-xs flex items-center gap-1.5">
              <Building2 size={13} className="text-indigo-600" />
              Create New Physical Room / Lab
            </h4>
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <form action={createRoomAction} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Room Name (e.g. Computer Lab 1)</label>
                <input
                  name="name"
                  type="text"
                  placeholder="e.g. Computer Lab 1"
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Max Physical Capacity</label>
                <input
                  name="capacity"
                  type="number"
                  defaultValue={20}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={createRoomPending}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
            >
              {createRoomPending ? 'Creating...' : 'Create Room'}
            </button>
            <StatusAlert state={createRoomState} />
          </form>
        </div>
      )}

      {/* Edit Room Form */}
      {editingItem && (
        <div className="rounded-2xl border-2 border-amber-500/60 bg-amber-50/20 dark:bg-amber-950/20 p-4 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h4 className="font-bold text-foreground text-xs">Edit Room: {editingItem.name}</h4>
            <button
              type="button"
              onClick={() => setEditingItem(null)}
              className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <form action={editRoomAction} className="space-y-3">
            <input type="hidden" name="id" value={editingItem.id} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Room Name</label>
                <input
                  name="name"
                  type="text"
                  defaultValue={editingItem.name}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground outline-none focus:border-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Student Capacity</label>
                <input
                  name="capacity"
                  type="number"
                  defaultValue={editingItem.capacity}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={editRoomPending}
                className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50 cursor-pointer"
              >
                {editRoomPending ? 'Saving...' : 'Update Room'}
              </button>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted cursor-pointer"
              >
                Cancel
              </button>
            </div>
            <StatusAlert state={editRoomState} />
          </form>
        </div>
      )}

      {/* Rooms Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
        {filtered.map((room: any) => (
          <div
            key={room.id}
            className="flex items-center justify-between rounded-2xl border border-border bg-card p-3 shadow-2xs hover:border-indigo-200 dark:hover:border-indigo-800 transition"
          >
            <div className="flex items-center gap-2.5">
              <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/60 p-2 text-indigo-600 dark:text-indigo-300 shrink-0">
                <Building2 size={16} />
              </div>
              <div>
                <span className="font-bold text-foreground text-xs sm:text-sm">{room.name}</span>
                <span className="block text-[11px] text-muted-foreground">Capacity: {room.capacity} seats</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setEditingItem(room)
                  setIsAddingNew(false)
                }}
                className="rounded-xl p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition cursor-pointer"
                title="Edit Room"
              >
                <Edit2 size={14} />
              </button>
              <form action={deleteRoomAction} className="inline">
                <input type="hidden" name="id" value={room.id} />
                <button
                  type="submit"
                  disabled={deleteRoomPending}
                  className="rounded-xl p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer disabled:opacity-50"
                  title="Delete Room"
                  onClick={(e) => {
                    if (!confirm('Are you sure you want to delete this room? Slots inside it will be affected.')) {
                      e.preventDefault()
                    }
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Course Management Component
// ─────────────────────────────────────────────────────────────────────────────
function CourseManagement({
  courses,
  createCourseState,
  createCourseAction,
  createCoursePending,
  editCourseState,
  editCourseAction,
  editCoursePending,
  deleteCourseAction,
  deleteCoursePending,
  editingItem,
  setEditingItem,
  isAddingNew,
  setIsAddingNew
}: any) {
  const [search, setSearch] = useState('')

  const filtered = courses.filter((c: any) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={13} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses..."
            className="w-full rounded-xl border border-border bg-muted/50 py-1.5 pl-8 pr-3 text-xs text-foreground outline-none focus:border-cyan-500 focus:bg-card"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            setIsAddingNew(!isAddingNew)
            setEditingItem(null)
          }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-cyan-700 transition cursor-pointer shadow-xs"
        >
          <Plus size={14} />
          <span>{isAddingNew ? 'Close Form' : 'Add New Course'}</span>
        </button>
      </div>

      {/* Add New Course Form */}
      {isAddingNew && (
        <div className="rounded-2xl border-2 border-cyan-500/60 bg-cyan-50/20 dark:bg-cyan-950/20 p-4 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h4 className="font-bold text-foreground text-xs flex items-center gap-1.5">
              <BookOpen size={13} className="text-cyan-600" />
              Create New Course
            </h4>
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <form action={createCourseAction} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Course Title</label>
              <input
                name="name"
                type="text"
                placeholder="e.g. Full Stack Web Development"
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground outline-none focus:border-cyan-500"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Monthly Base Fee (PKR)</label>
                <input
                  name="fee"
                  type="number"
                  placeholder="3000"
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground outline-none focus:border-cyan-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Duration (Months)</label>
                <input
                  name="duration"
                  type="number"
                  placeholder="3"
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground outline-none focus:border-cyan-500"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={createCoursePending}
              className="rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-700 disabled:opacity-50 cursor-pointer"
            >
              {createCoursePending ? 'Creating...' : 'Create Course'}
            </button>
            <StatusAlert state={createCourseState} />
          </form>
        </div>
      )}

      {/* Edit Course Form */}
      {editingItem && (
        <div className="rounded-2xl border-2 border-emerald-500/60 bg-emerald-50/20 dark:bg-emerald-950/20 p-4 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h4 className="font-bold text-foreground text-xs">Edit Course: {editingItem.name}</h4>
            <button
              type="button"
              onClick={() => setEditingItem(null)}
              className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <form action={editCourseAction} className="space-y-3">
            <input type="hidden" name="id" value={editingItem.id} />
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Course Title</label>
              <input
                name="name"
                type="text"
                defaultValue={editingItem.name}
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Fee (PKR)</label>
                <input
                  name="fee"
                  type="number"
                  defaultValue={Number(editingItem.baseFee)}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Duration (Months)</label>
                <input
                  name="duration"
                  type="number"
                  defaultValue={editingItem.durationMonths}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={editCoursePending}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
              >
                {editCoursePending ? 'Saving...' : 'Update Course'}
              </button>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted cursor-pointer"
              >
                Cancel
              </button>
            </div>
            <StatusAlert state={editCourseState} />
          </form>
        </div>
      )}

      {/* Courses List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
        {filtered.map((course: any) => (
          <div
            key={course.id}
            className="flex items-center justify-between rounded-2xl border border-border bg-card p-3 shadow-2xs hover:border-cyan-200 dark:hover:border-cyan-800 transition"
          >
            <div className="flex items-center gap-2.5">
              <div className="rounded-xl bg-cyan-50 dark:bg-cyan-950/60 p-2 text-cyan-600 dark:text-cyan-300 shrink-0">
                <BookOpen size={16} />
              </div>
              <div>
                <span className="font-bold text-foreground text-xs sm:text-sm">{course.name}</span>
                <span className="block text-[11px] text-muted-foreground">
                  {course.durationMonths} Months • PKR {Number(course.baseFee).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setEditingItem(course)
                  setIsAddingNew(false)
                }}
                className="rounded-xl p-1.5 text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 transition cursor-pointer"
                title="Edit Course"
              >
                <Edit2 size={14} />
              </button>
              <form action={deleteCourseAction} className="inline">
                <input type="hidden" name="id" value={course.id} />
                <button
                  type="submit"
                  disabled={deleteCoursePending}
                  className="rounded-xl p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer disabled:opacity-50"
                  title="Delete Course"
                  onClick={(e) => {
                    if (!confirm('Are you sure you want to delete this course?')) {
                      e.preventDefault()
                    }
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Slot Management Component
// ─────────────────────────────────────────────────────────────────────────────
function SlotManagement({
  slots,
  rooms,
  createSlotState,
  createSlotAction,
  createSlotPending,
  editSlotState,
  editSlotAction,
  editSlotPending,
  deleteSlotAction,
  deleteSlotPending,
  editingItem,
  setEditingItem,
  isAddingNew,
  setIsAddingNew
}: any) {
  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground font-semibold">{slots.length} Timing Slots configured</span>

        <button
          type="button"
          onClick={() => {
            setIsAddingNew(!isAddingNew)
            setEditingItem(null)
          }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-amber-700 transition cursor-pointer shadow-xs"
        >
          <Plus size={14} />
          <span>{isAddingNew ? 'Close Form' : 'Add New Slot'}</span>
        </button>
      </div>

      {/* Add New Slot Form */}
      {isAddingNew && (
        <div className="rounded-2xl border-2 border-amber-500/60 bg-amber-50/20 dark:bg-amber-950/20 p-4 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h4 className="font-bold text-foreground text-xs flex items-center gap-1.5">
              <Clock size={13} className="text-amber-600" />
              Configure New Time Slot
            </h4>
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <form action={createSlotAction} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Room Assignment</label>
                <select
                  name="roomId"
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground outline-none focus:border-amber-500"
                  required
                >
                  <option value="">-- Choose Room --</option>
                  {rooms.map((r: any) => (
                    <option key={r.id} value={r.id}>
                      {r.name} (Capacity: {r.capacity})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Days Pattern (e.g. MON,TUE,WED)</label>
                <input
                  name="days"
                  type="text"
                  placeholder="e.g. MON,TUE,WED,THU,FRI"
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Start Time (24h format e.g. 09:00)</label>
                <input
                  name="startTime"
                  type="time"
                  defaultValue="09:00"
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground outline-none focus:border-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">End Time (24h format e.g. 10:00)</label>
                <input
                  name="endTime"
                  type="time"
                  defaultValue="10:00"
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={createSlotPending}
              className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50 cursor-pointer"
            >
              {createSlotPending ? 'Creating...' : 'Create Slot'}
            </button>
            <StatusAlert state={createSlotState} />
          </form>
        </div>
      )}

      {/* Edit Slot Form */}
      {editingItem && (
        <div className="rounded-2xl border-2 border-amber-500/60 bg-amber-50/20 dark:bg-amber-950/20 p-4 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h4 className="font-bold text-foreground text-xs">Edit Time Slot</h4>
            <button
              type="button"
              onClick={() => setEditingItem(null)}
              className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <form action={editSlotAction} className="space-y-3">
            <input type="hidden" name="id" value={editingItem.id} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Room</label>
                <select
                  name="roomId"
                  defaultValue={editingItem.roomId}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground outline-none focus:border-amber-500"
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
                <label className="block text-xs font-semibold text-foreground mb-1">Days Pattern</label>
                <input
                  name="days"
                  type="text"
                  defaultValue={editingItem.days}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Start Time</label>
                <input
                  name="startTime"
                  type="time"
                  defaultValue={new Date(new Date(editingItem.startTime).getTime() + (5 * 60 * 60 * 1000)).toTimeString().slice(0, 5)}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground outline-none focus:border-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">End Time</label>
                <input
                  name="endTime"
                  type="time"
                  defaultValue={new Date(new Date(editingItem.endTime).getTime() + (5 * 60 * 60 * 1000)).toTimeString().slice(0, 5)}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={editSlotPending}
                className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50 cursor-pointer"
              >
                {editSlotPending ? 'Saving...' : 'Update Slot'}
              </button>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted cursor-pointer"
              >
                Cancel
              </button>
            </div>
            <StatusAlert state={editSlotState} />
          </form>
        </div>
      )}

      {/* Slots List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
        {slots.map((slot: any) => (
          <div
            key={slot.id}
            className="flex items-center justify-between rounded-2xl border border-border bg-card p-3 shadow-2xs hover:border-amber-200 dark:hover:border-amber-800 transition"
          >
            <div className="flex items-center gap-2.5">
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/60 p-2 text-amber-600 dark:text-amber-300 shrink-0">
                <Clock size={16} />
              </div>
              <div>
                <span className="font-bold text-foreground text-xs sm:text-sm">{slot.room.name}</span>
                <span className="block text-[11px] text-muted-foreground">
                  {new Date(slot.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })} - {new Date(slot.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })} • ({slot.days})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setEditingItem(slot)
                  setIsAddingNew(false)
                }}
                className="rounded-xl p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition cursor-pointer"
                title="Edit Slot"
              >
                <Edit2 size={14} />
              </button>
              <form action={deleteSlotAction} className="inline">
                <input type="hidden" name="id" value={slot.id} />
                <button
                  type="submit"
                  disabled={deleteSlotPending}
                  className="rounded-xl p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer disabled:opacity-50"
                  title="Delete Slot"
                  onClick={(e) => {
                    if (!confirm('Are you sure you want to delete this slot?')) {
                      e.preventDefault()
                    }
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Assignment Management Component
// ─────────────────────────────────────────────────────────────────────────────
function AssignmentManagement({
  courses,
  rawCourses,
  slots,
  teachers,
  assignCourseState,
  assignCourseAction,
  assignCoursePending,
  changeTeacherState,
  changeTeacherAction,
  changeTeacherPending,
  changeRoomState,
  changeRoomAction,
  changeRoomPending,
  handleDeleteAssignment,
  editingItem,
  setEditingItem,
  isAddingNew,
  setIsAddingNew
}: any) {
  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground font-semibold">Active Class & Teacher Assignments</span>

        <button
          type="button"
          onClick={() => {
            setIsAddingNew(!isAddingNew)
            setEditingItem(null)
          }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-purple-700 transition cursor-pointer shadow-xs"
        >
          <Plus size={14} />
          <span>{isAddingNew ? 'Close Form' : 'Schedule Class & Teacher'}</span>
        </button>
      </div>

      {/* Schedule New Class Form */}
      {isAddingNew && (
        <div className="rounded-2xl border-2 border-purple-500/60 bg-purple-50/20 dark:bg-purple-950/20 p-4 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h4 className="font-bold text-foreground text-xs flex items-center gap-1.5">
              <UserCheck size={13} className="text-purple-600" />
              Schedule Course to Slot & Teacher
            </h4>
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <form action={assignCourseAction} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Select Course</label>
                <select
                  name="courseId"
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground outline-none focus:border-purple-500"
                  required
                >
                  <option value="">-- Choose Course --</option>
                  {rawCourses.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Select Time Slot</label>
                <select
                  name="slotId"
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground outline-none focus:border-purple-500"
                  required
                >
                  <option value="">-- Choose Slot --</option>
                  {slots.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.room.name} • {s.days} (
                      {new Date(s.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Assign Teacher</label>
                <select
                  name="teacherId"
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground outline-none focus:border-purple-500"
                  required
                >
                  <option value="">-- Choose Teacher --</option>
                  {teachers.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.firstName} {t.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={assignCoursePending}
              className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700 disabled:opacity-50 cursor-pointer"
            >
              {assignCoursePending ? 'Scheduling...' : 'Schedule Class'}
            </button>
            <StatusAlert state={assignCourseState} />
          </form>
        </div>
      )}

      {/* Change Teacher Form */}
      {editingItem && editingItem.editType === 'teacher' && (
        <div className="rounded-2xl border-2 border-purple-500/60 bg-purple-50/20 dark:bg-purple-950/20 p-4 space-y-3 animate-in fade-in duration-150">
          <h4 className="font-bold text-foreground text-xs">Change Teacher for {editingItem.courseName}</h4>
          <form action={changeTeacherAction} className="space-y-3">
            <input type="hidden" name="assignmentId" value={editingItem.id} />
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Select New Teacher</label>
              <select
                name="teacherId"
                defaultValue={editingItem.teacherId || ''}
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground outline-none focus:border-purple-500"
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
                className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700 disabled:opacity-50 cursor-pointer"
              >
                {changeTeacherPending ? 'Updating...' : 'Save Teacher'}
              </button>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted cursor-pointer"
              >
                Cancel
              </button>
            </div>
            <StatusAlert state={changeTeacherState} />
          </form>
        </div>
      )}

      {/* Change Room/Slot Form */}
      {editingItem && editingItem.editType === 'room' && (
        <div className="rounded-2xl border-2 border-amber-500/60 bg-amber-50/20 dark:bg-amber-950/20 p-4 space-y-3 animate-in fade-in duration-150">
          <h4 className="font-bold text-foreground text-xs">Change Timing Slot for {editingItem.courseName}</h4>
          <form action={changeRoomAction} className="space-y-3">
            <input type="hidden" name="assignmentId" value={editingItem.id} />
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Select New Slot</label>
              <select
                name="slotId"
                defaultValue={editingItem.slotId || ''}
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground outline-none focus:border-amber-500"
                required
              >
                <option value="">-- Choose Slot --</option>
                {slots.map((slot: any) => (
                  <option key={slot.id} value={slot.id}>
                    {slot.room.name} • {slot.days} (
                    {new Date(slot.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={changeRoomPending}
                className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50 cursor-pointer"
              >
                {changeRoomPending ? 'Updating...' : 'Save Slot'}
              </button>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted cursor-pointer"
              >
                Cancel
              </button>
            </div>
            <StatusAlert state={changeRoomState} />
          </form>
        </div>
      )}

      {/* Existing Assignments List */}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {courses.length === 0 || courses.every((c: any) => !c.slotAssignments || c.slotAssignments.length === 0) ? (
          <div className="text-center py-8 text-muted-foreground border border-dashed rounded-2xl">
            <p>No active assignments found.</p>
          </div>
        ) : (
          courses.map((course: CourseWithAssignments) =>
            course.slotAssignments?.map((assignment) => (
              <div
                key={assignment.id}
                className="flex items-center justify-between rounded-2xl border border-border bg-card p-3 shadow-2xs hover:border-purple-200 dark:hover:border-purple-800 transition"
              >
                <div className="flex items-center gap-2.5">
                  <div className="rounded-xl bg-purple-50 dark:bg-purple-950/60 p-2 text-purple-600 dark:text-purple-300 shrink-0">
                    <UserCheck size={16} />
                  </div>
                  <div>
                    <span className="font-bold text-foreground text-xs sm:text-sm">{course.name}</span>
                    <span className="block text-[11px] text-muted-foreground">
                      {assignment.slot.room.name} • {assignment.slot.days} • Teacher:{' '}
                      <strong className="text-foreground">
                        {assignment.teacher?.firstName ? `${assignment.teacher.firstName} ${assignment.teacher.lastName || ''}` : 'None'}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItem({ ...assignment, courseName: course.name, editType: 'teacher' })
                      setIsAddingNew(false)
                    }}
                    className="rounded-xl p-1.5 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition cursor-pointer"
                    title="Change Teacher"
                  >
                    <UserCheck size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItem({ ...assignment, courseName: course.name, editType: 'room' })
                      setIsAddingNew(false)
                    }}
                    className="rounded-xl p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition cursor-pointer"
                    title="Change Room/Slot"
                  >
                    <Edit2 size={14} />
                  </button>
                  <form action={handleDeleteAssignment} className="inline">
                    <input type="hidden" name="id" value={assignment.id} />
                    <button
                      type="submit"
                      className="rounded-xl p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title="Delete Assignment"
                      onClick={(e) => {
                        if (!confirm('Are you sure you want to delete this course assignment?')) {
                          e.preventDefault()
                        }
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </form>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  )
}

function StatusAlert({ state }: { state: ActionState }) {
  if (!state.message && !state.error) return null

  return (
    <div
      className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
        state.success
          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50'
          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50'
      }`}
    >
      {state.success ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
      <span>{state.message || state.error}</span>
    </div>
  )
}