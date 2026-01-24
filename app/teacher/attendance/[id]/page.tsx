// app/teacher/attendance/[id]/page.tsx
import { auth } from "@clerk/nextjs/server"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { AttendanceForm } from "./attendance-form" // 👈 Import the new component
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function MarkClassAttendance({ params }: { params: { id: string } }) {
  const { id } = await params
  const { userId } = await auth()
  
  if (!userId) redirect("/sign-in")

  // 1. Get Teacher Info
  const teacher = await prisma.user.findFirst({ where: { clerkId: userId } })
  if (!teacher) redirect("/")

  // 2. Get Class & Students
  const classData = await prisma.courseOnSlot.findUnique({
    where: { id },
    include: {
      course: true,
      enrollments: {
        where: { status: 'ACTIVE' },
        include: { student: true },
        orderBy: { student: { name: 'asc' } }
      }
    }
  })

  if (!classData) return <div>Class not found</div>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/teacher/attendance" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft size={20} />
          Back to Attendance
        </Link>
      </div>
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{classData.course.name}</h1>
        <p className="text-gray-500">Marking attendance for {new Date().toLocaleDateString()}</p>
      </div>

      {/* 👇 Render the Client Component with the data */}
      <AttendanceForm 
        classId={id} 
        teacherId={teacher.id} 
        enrollments={classData.enrollments} 
      />
    </div>
  )
}