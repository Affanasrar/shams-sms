// app/teacher/attendance/page.tsx
import { auth } from "@clerk/nextjs/server"
import prisma from "@/lib/prisma"
import { Clock, MapPin, ArrowRight, CheckSquare, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function AttendanceSelectionPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const user = await prisma.user.findFirst({ where: { clerkId: userId } })
  if (!user) redirect("/")

  // Fetch classes assigned to this teacher
  const classes = await prisma.courseOnSlot.findMany({
    where: { teacherId: user.id },
    include: {
      course: true,
      slot: { include: { room: true } },
      _count: { select: { enrollments: { where: { status: 'ACTIVE' } } } }
    }
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/teacher" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft size={20} />
          Back to Dashboard
        </Link>
      </div>
      
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-blue-100 text-blue-700 rounded-lg">
          <CheckSquare size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mark Attendance</h1>
          <p className="text-gray-500 text-sm md:text-base">Select a class to take attendance for today.</p>
        </div>
      </div>

      <div className="grid gap-4">
        {classes.map((cls) => (
          <Link 
            key={cls.id} 
            href={`/teacher/attendance/${cls.id}`} // Links to the marking page
            className="group bg-white border hover:border-blue-500 hover:shadow-md transition-all p-4 md:p-6 rounded-xl flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4"
          >
            <div className="flex-1">
              <h3 className="font-bold text-lg">{cls.course.name}</h3>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-sm text-gray-500 mt-2">
                <span className="flex items-center gap-1"><Clock size={14}/> {new Date(cls.slot.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })} - {new Date(cls.slot.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })}</span>
                <span className="flex items-center gap-1"><Clock size={14}/> {cls.slot.days}</span>
                <span className="flex items-center gap-1"><MapPin size={14}/> {cls.slot.room.name}</span>
              </div>
            </div>
            <div className="h-10 w-10 bg-gray-50 group-hover:bg-blue-600 group-hover:text-white rounded-full flex items-center justify-center transition-colors self-end sm:self-center">
              <ArrowRight size={20} />
            </div>
          </Link>
        ))}

        {classes.length === 0 && (
          <div className="text-center py-8 md:py-12 bg-white rounded-xl border border-dashed">
            <p className="text-gray-400">No classes found assigned to you.</p>
          </div>
        )}
      </div>
    </div>
  )
}