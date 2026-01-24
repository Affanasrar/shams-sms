// app/admin/attendance/[id]/page.tsx
import { auth } from "@clerk/nextjs/server"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { AttendanceViewer } from "./attendance-viewer"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function AdminClassAttendance({ params }: { params: { id: string } }) {
  const { id } = await params
  const { userId } = await auth()

  if (!userId) redirect("/sign-in")

  // Verify admin
  const user = await prisma.user.findFirst({ where: { clerkId: userId } })
  if (!user || user.role !== 'ADMIN') redirect("/")

  // Get class details
  const classData = await prisma.courseOnSlot.findUnique({
    where: { id },
    include: {
      course: true,
      slot: { include: { room: true } },
      teacher: true,
      enrollments: {
        where: { status: 'ACTIVE' },
        include: { student: true },
        orderBy: { student: { name: 'asc' } }
      }
    }
  })

  if (!classData) return <div>Class not found</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/attendance"
          className="text-gray-600 hover:text-gray-900 transition"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{classData.course.name} - Attendance</h1>
          <p className="text-gray-500">
            {classData.slot.days} • {new Date(classData.slot.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} • {classData.slot.room.name}
          </p>
        </div>
      </div>

      <AttendanceViewer
        classId={id}
        adminId={user.id}
        enrollments={classData.enrollments}
      />
    </div>
  )
}