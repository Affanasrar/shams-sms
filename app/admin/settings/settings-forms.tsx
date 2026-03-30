// app/admin/settings/settings-forms.tsx
'use client'

import { useActionState } from 'react'
import React from 'react'
import { createRoom, createCourse, createSlot, assignCourseToSlot } from '@/app/actions/settings'
import { updateCourseFee, getCourseFeeHistory } from '@/app/actions/course-fees'
import { 
  Building2, 
  BookOpen, 
  Clock, 
  Link as LinkIcon, 
  Plus, 
  CheckCircle2, 
  AlertCircle,
  CalendarDays,
  DollarSign,
  History
} from 'lucide-react'

// --- Types ---
type ActionState = {
  success: boolean
  message?: string
  error?: string
}

const initialState: ActionState = { success: false }

type Props = {
  rooms: any[]
  courses: any[]
  slots: any[]
  teachers: any[]
}

// --- Main Component ---
export function SettingsForms({ rooms, courses, slots, teachers }: Props) {
  const [roomState, roomAction, roomPending] = useActionState<ActionState, FormData>(createRoom, initialState)
  const [courseState, courseAction, coursePending] = useActionState<ActionState, FormData>(createCourse, initialState)
  const [slotState, slotAction, slotPending] = useActionState<ActionState, FormData>(createSlot, initialState)
  const [linkState, linkAction, linkPending] = useActionState<ActionState, FormData>(assignCourseToSlot, initialState)

  return (
    <div className="space-y-10">
      
      {/* SECTION 1: Master Data (The Foundation) */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <CalendarDays className="text-gray-500" /> 
          Infrastructure & Academics
        </h3>
        
        <div className="grid gap-6 md:grid-cols-3">
          
          {/* 1. ROOMS CARD */}
          <FormCard 
            title="Create Room" 
            description="Physical labs or classrooms." 
            icon={<Building2 size={20} className="text-indigo-600"/>}
          >
            <form action={roomAction} className="space-y-4">
              <InputGroup label="Room Name" name="name" placeholder="e.g. Computer Lab 1" />
              <InputGroup label="Capacity" name="capacity" type="number" placeholder="20" />
              
              <SubmitButton pending={roomPending} label="Add Room" />
              <StatusAlert state={roomState} />
            </form>
          </FormCard>

          {/* 2. COURSES CARD */}
          <FormCard 
            title="Create Course" 
            description="Subjects offered to students." 
            icon={<BookOpen size={20} className="text-emerald-600"/>}
          >
            <form action={courseAction} className="space-y-4">
              <InputGroup label="Course Name" name="name" placeholder="e.g. Graphic Design" />
              <div className="grid grid-cols-2 gap-3">
                <InputGroup label="Fee (PKR)" name="fee" type="number" placeholder="2000" />
                <InputGroup label="Months" name="duration" type="number" placeholder="3" />
              </div>
              
              <SubmitButton pending={coursePending} label="Add Course" color="emerald" />
              <StatusAlert state={courseState} />
            </form>
          </FormCard>

          {/* 3. TIME SLOTS CARD */}
          <FormCard 
            title="Create Time Slot" 
            description="Available time blocks per room." 
            icon={<Clock size={20} className="text-amber-600"/>}
          >
            <form action={slotAction} className="space-y-4">
              <SelectGroup label="Select Room">
                <select name="roomId" className="w-full bg-transparent outline-none">
                  {rooms.map(r => <option key={r.id} value={r.id}>{r.name} (Cap: {r.capacity})</option>)}
                </select>
              </SelectGroup>

              <InputGroup label="Days" name="days" placeholder="Mon, Wed, Fri" />
              
              <div className="grid grid-cols-2 gap-3">
                <InputGroup label="Start" name="startTime" type="time" />
                <InputGroup label="End" name="endTime" type="time" />
              </div>

              <SubmitButton pending={slotPending} label="Add Slot" color="amber" />
              <StatusAlert state={slotState} />
            </form>
          </FormCard>

        </div>
      </div>

      <hr className="border-gray-200" />

      {/* SECTION 2: Operations (The Link) */}
      <div>
         <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <LinkIcon className="text-gray-500" /> 
          Class Scheduling
        </h3>

        {/* 4. ASSIGNMENT CARD (Wide & Featured) */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-xl overflow-hidden text-white">
          <div className="p-8 md:flex md:gap-10">
            
            {/* Left Side: Info */}
            <div className="md:w-1/3 mb-6 md:mb-0 space-y-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-blue-400 mb-4">
                <LinkIcon size={24} />
              </div>
              <h2 className="text-2xl font-bold">Assign Class & Teacher</h2>
              <p className="text-slate-400 leading-relaxed">
                This is the final step. Link a Course to a Time Slot and assign a Teacher to create a live class available for enrollment.
              </p>
              <div className="text-xs bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full w-fit">
                Step 4 of 4
              </div>
            </div>

            {/* Right Side: Form */}
            <div className="md:w-2/3 bg-white/5 p-6 rounded-xl border border-white/10">
              <form action={linkAction} className="space-y-5">
                
                <div className="grid md:grid-cols-2 gap-5">
                  <DarkSelectGroup label="Select Course">
                    <select name="courseId" className="w-full bg-transparent outline-none text-white [&>option]:text-black">
                      {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </DarkSelectGroup>

                  <DarkSelectGroup label="Select Teacher">
                    <select name="teacherId" className="w-full bg-transparent outline-none text-white [&>option]:text-black">
                      <option value="">-- Choose Teacher --</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
                      ))}
                    </select>
                  </DarkSelectGroup>
                </div>

                <DarkSelectGroup label="Select Time Slot">
                   <select name="slotId" className="w-full bg-transparent outline-none text-white [&>option]:text-black">
                    {slots.map(s => (
                      <option key={s.id} value={s.id}>
                        {/* 👇 FIXED: Force US English Locale for Time Formatting */}
                        {s.room.name} — {s.days} ({new Date(s.startTime).toLocaleTimeString('en-US',{hour:'2-digit', minute:'2-digit', hour12: true, timeZone: 'Asia/Karachi'})})
                      </option>
                    ))}
                  </select>
                </DarkSelectGroup>

                <button 
                  disabled={linkPending} 
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg hover:shadow-blue-500/30 flex justify-center items-center gap-2"
                >
                  {linkPending ? 'Processing...' : (
                    <>
                      <CheckCircle2 size={18} /> Activate Class Schedule
                    </>
                  )}
                </button>
                
                {linkState?.message && (
                  <div className="bg-green-500/20 border border-green-500/50 text-green-200 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                    <CheckCircle2 size={16} /> {linkState.message}
                  </div>
                )}
                {linkState?.error && (
                  <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                    <AlertCircle size={16} /> {linkState.error}
                  </div>
                )}

              </form>
            </div>
          </div>
        </div>

      </div>

      <hr className="border-gray-200" />

      {/* SECTION 3: Course Fee Management */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <DollarSign className="text-gray-500" /> 
          Course Fee Management
        </h3>

        <div className="grid gap-6 md:grid-cols-2">
          
          {/* Update Course Fees */}
          <FormCard 
            title="Update Course Fees" 
            description="Change fees for new enrollments. Existing students keep their original fees." 
            icon={<DollarSign size={20} className="text-blue-600"/>}
          >
            <div className="space-y-4">
              {courses.map(course => (
                <CourseFeeUpdater key={course.id} course={course} />
              ))}
            </div>
          </FormCard>

          {/* Fee History */}
          <FormCard 
            title="Fee Change History" 
            description="View all fee changes and when they were made." 
            icon={<History size={20} className="text-purple-600"/>}
          >
            <div className="space-y-4">
              {courses.map(course => (
                <CourseFeeHistory key={course.id} course={course} />
              ))}
            </div>
          </FormCard>

        </div>
      </div>
    </div>
  )
}


// --- Reusable UI Components (Internal) ---

function FormCard({ title, description, icon, children }: { title: string, description: string, icon: React.ReactNode, children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
      <div className="p-5 border-b border-gray-50 bg-gray-50/50 flex items-start justify-between">
        <div>
          <h4 className="font-bold text-gray-800">{title}</h4>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        </div>
        <div className="bg-white p-2 rounded-lg border shadow-sm">{icon}</div>
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  )
}

function InputGroup({ label, name, type = "text", placeholder }: { label: string, name: string, type?: string, placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
      <input 
        name={name} 
        type={type} 
        placeholder={placeholder} 
        required 
        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
      />
    </div>
  )
}

function SelectGroup({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
      <div className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus-within:ring-2 focus-within:ring-black/5 focus-within:border-black transition-all">
        {children}
      </div>
    </div>
  )
}
// --- Course Fee Management Components ---

function CourseFeeUpdater({ course }: { course: any }) {
  const [feeState, feeAction, feePending] = useActionState<ActionState, FormData>(updateCourseFee, initialState)

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <h5 className="font-semibold text-gray-800">{course.name}</h5>
        <span className="text-sm text-gray-600">Current: PKR {course.baseFee.toLocaleString()}</span>
      </div>
      
      <form action={feeAction} className="flex gap-2">
        <input type="hidden" name="courseId" value={course.id} />
        <input
          name="newFee"
          type="number"
          placeholder="New fee"
          min="0"
          step="0.01"
          className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          disabled={feePending}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
        >
          {feePending ? 'Updating...' : 'Update'}
        </button>
      </form>
      
      {feeState?.message && (
        <div className="mt-2 text-sm text-green-600">{feeState.message}</div>
      )}
      {feeState?.error && (
        <div className="mt-2 text-sm text-red-600">{feeState.error}</div>
      )}
    </div>
  )
}

function CourseFeeHistory({ course }: { course: any }) {
  const [history, setHistory] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/admin/course-fee-history/${course.id}`)
        if (response.ok) {
          const data = await response.json()
          setHistory(data)
        }
      } catch (error) {
        console.error('Failed to fetch fee history:', error)
      }
      setLoading(false)
    }

    fetchHistory()
  }, [course.id])

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <h5 className="font-semibold text-gray-800 mb-3">{course.name}</h5>
      
      {loading ? (
        <div className="text-sm text-gray-500">Loading history...</div>
      ) : history.length === 0 ? (
        <div className="text-sm text-gray-500">No fee changes yet</div>
      ) : (
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {history.map((change: any) => (
            <div key={change.id} className="text-xs bg-gray-50 p-2 rounded">
              <div className="flex justify-between">
                <span>PKR {Number(change.oldFee).toLocaleString()} → PKR {Number(change.newFee).toLocaleString()}</span>
                <span className="text-gray-500">
                  {new Date(change.changedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="text-gray-600 mt-1">
                by {change.changedBy.firstName} {change.changedBy.lastName}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
function DarkSelectGroup({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-blue-200/70 uppercase tracking-wider mb-1.5">{label}</label>
      <div className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500 transition-all">
        {children}
      </div>
    </div>
  )
}

function SubmitButton({ pending, label, color = "indigo" }: { pending: boolean, label: string, color?: string }) {
  const colors: any = {
    indigo: "bg-indigo-600 hover:bg-indigo-700",
    emerald: "bg-emerald-600 hover:bg-emerald-700",
    amber: "bg-amber-600 hover:bg-amber-700"
  }
  
  return (
    <button 
      disabled={pending}
      className={`w-full ${colors[color]} text-white font-medium py-2.5 rounded-lg text-sm transition-all flex justify-center items-center gap-2 mt-2`}
    >
      {pending ? 'Saving...' : <><Plus size={16} /> {label}</>}
    </button>
  )
}

function StatusAlert({ state }: { state: ActionState }) {
  if (!state.message && !state.error) return null

  const isSuccess = !!state.message
  return (
    <div className={`mt-3 p-3 rounded-lg text-xs flex items-start gap-2 ${
      isSuccess ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
    }`}>
      {isSuccess ? <CheckCircle2 size={14} className="mt-0.5"/> : <AlertCircle size={14} className="mt-0.5"/>}
      <p>{isSuccess ? state.message : state.error}</p>
    </div>
  )
}