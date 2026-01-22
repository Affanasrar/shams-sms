// app/admin/schedule/page.tsx
import prisma from '@/lib/prisma'
import { SlotCard } from './slot-card' 
import { CalendarDays } from 'lucide-react'

// Force fresh data every time so capacity is accurate
export const dynamic = 'force-dynamic'

// 👇 THIS "export default" IS REQUIRED BY NEXT.JS
export default async function SchedulePage() {
  
  // Fetch Slots with Room details and Active Enrollments
  const assignments = await prisma.courseOnSlot.findMany({
    include: {
      course: true,
      teacher: true,
      slot: {
        include: { room: true }
      },
      enrollments: {
        where: { status: 'ACTIVE' },
        select: { endDate: true } // Fetch dates to calculate vacancies
      }
    },
    orderBy: { slot: { startTime: 'asc' } }
  })

  // Group by Day for better layout
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  
  const scheduleByDay = days.reduce((acc, day) => {
    acc[day] = assignments.filter(a => a.slot.days.includes(day))
    return acc
  }, {} as Record<string, typeof assignments>)

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-black text-white rounded-lg">
          <CalendarDays size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Class Timetable & Capacity</h1>
          <p className="text-gray-500">Monitor active classes, occupancy, and upcoming vacancies.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {days.filter(d => scheduleByDay[d].length > 0).map((day) => (
          <div key={day} className="flex flex-col gap-4">
            
            {/* Day Header */}
            <div className="bg-gray-100 p-3 rounded-lg text-center font-bold text-gray-700 border border-gray-200">
              {day}
            </div>

            {/* Render Slots for this Day */}
            <div className="space-y-4">
              {scheduleByDay[day].map((assignment) => (
                <SlotCard key={assignment.id} data={assignment} />
              ))}
            </div>

          </div>
        ))}
      </div>

      {assignments.length === 0 && (
        <div className="text-center py-20 bg-white border border-dashed rounded-xl">
          <p className="text-gray-500">No classes scheduled yet.</p>
          <p className="text-sm">Go to Configuration to assign courses to slots.</p>
        </div>
      )}
    </div>
  )
}