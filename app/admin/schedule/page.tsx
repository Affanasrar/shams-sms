// app/admin/schedule/page.tsx
import prisma from '@/lib/prisma'
import { Calendar, Clock, MapPin } from 'lucide-react'

export default async function SchedulePage() {
  // 1. Fetch all Rooms with their Slots and assigned Courses
  const rooms = await prisma.room.findMany({
    include: {
      slots: {
        include: {
          courses: {
            include: { course: true }
          }
        },
        orderBy: { startTime: 'asc' }
      }
    }
  })

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Calendar className="w-8 h-8" /> Master Schedule
        </h1>
        <div className="text-sm text-gray-500">
          Showing all active time slots across {rooms.length} rooms
        </div>
      </div>

      <div className="grid gap-8">
        {rooms.map((room) => (
          <div key={room.id} className="bg-white border rounded-xl shadow-sm overflow-hidden">
            
            {/* Room Header */}
            <div className="bg-black text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-2 font-bold text-lg">
                <MapPin size={20} /> {room.name}
              </div>
              <span className="text-xs bg-gray-800 px-3 py-1 rounded-full">
                Capacity: {room.capacity}
              </span>
            </div>

            {/* Slots Grid */}
            <div className="p-6">
              {room.slots.length === 0 ? (
                <p className="text-gray-400 italic text-center py-4">No slots assigned to this room yet.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {room.slots.map((slot) => {
                    const startTime = new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    const endTime = new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    
                    return (
                      <div key={slot.id} className="border rounded-lg p-4 hover:border-black transition group relative">
                        {/* Time & Days */}
                        <div className="flex justify-between items-start mb-3">
                           <div className="flex items-center gap-1.5 text-black font-bold">
                             <Clock size={16} />
                             {startTime} - {endTime}
                           </div>
                        </div>
                        <div className="text-xs font-mono text-gray-500 bg-gray-100 inline-block px-2 py-1 rounded mb-3">
                          {slot.days}
                        </div>

                        {/* Courses List */}
                        <div className="space-y-2">
                          {slot.courses.length === 0 ? (
                            <div className="text-sm text-red-400 italic">Empty Slot</div>
                          ) : (
                            slot.courses.map((assignment) => (
                              <div key={assignment.id} className="text-sm flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                <span className="font-medium text-gray-700">
                                  {assignment.course.name}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                        
                        {/* Hover Capacity Hint */}
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition text-xs text-gray-400">
                          {slot.courses.length} active classes
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}