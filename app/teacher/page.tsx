// app/teacher/page.tsx
import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { Clock, Users, MapPin, ArrowRight, FileText } from "lucide-react"
import Link from "next/link"
import { PageLayout, PageHeader } from '@/components/ui'

export default async function TeacherDashboard() {
  const { userId } = await auth()
  const user = await currentUser()

  if (!userId || !user) {
    redirect("/sign-in")
  }

  const email = user.emailAddresses[0].emailAddress

  // 1. Try to find the user in DB
  let dbUser = await prisma.user.findFirst({
    where: {
      OR: [
        { clerkId: userId },
        { email: email }
      ]
    }
  })

  // 2. 👇 SELF-HEALING: If user is missing, CREATE THEM INSTANTLY!
  if (!dbUser) {
    console.log(`🛠️ Auto-Creating Missing Teacher: ${email}`)
    
    // Default everyone to TEACHER, unless their email says "admin"
    const role = email.toLowerCase().includes("admin") ? "ADMIN" : "TEACHER"

    try {
      dbUser = await prisma.user.create({
        data: {
          clerkId: userId,
          email: email,
          firstName: user.firstName || "New",
          lastName: user.lastName || "Teacher",
          role: role as "ADMIN" | "TEACHER"
        }
      })
    } catch (e) {
      console.error("Error auto-creating user:", e)
    }
  }

  // 3. 👇 SELF-HEALING: If Clerk ID mismatch (e.g. they were created manually), Link them
  if (dbUser && dbUser.clerkId !== userId) {
    dbUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: { clerkId: userId }
    })
  }

  // 4. Safety Check: If still no user (Database error?), show access denied
  if (!dbUser) {
    return <div>Database Error: Could not create user profile.</div>
  }

  // 5. Fetch Classes Assigned to This Teacher
  const myClasses = await prisma.courseOnSlot.findMany({
    where: { teacherId: dbUser.id },
    include: {
      course: true,
      slot: { include: { room: true } },
      _count: { select: { enrollments: { where: { status: 'ACTIVE' } } } }
    },
    orderBy: { slot: { startTime: 'asc' } }
  })

  return (
    <PageLayout>
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 p-4 md:p-8 rounded-2xl text-white shadow-lg">
        <h1 className="text-2xl md:text-3xl font-bold">Hello, {dbUser.firstName || "Teacher"}! 👋</h1>
        <p className="text-blue-100 mt-2 text-sm md:text-base">Ready to inspire some minds today?</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="My Classes" value={myClasses.length} />
        <StatCard label="Active Students" value={myClasses.reduce((acc, c) => acc + c._count.enrollments, 0)} />
        <StatCard label="Pending Exams" value="0" />
      </div>

      <div className="mt-4">
        <a
          href="/teacher/reports"
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-medium text-sm"
        >
          <FileText size={16} />
          Reports
        </a>
      </div>

      {/* Class List */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Clock className="text-blue-600"/> My Teaching Schedule
        </h2>

        <div className="grid gap-4 md:gap-6">
          {myClasses.length === 0 ? (
            <div className="text-center p-8 md:p-12 bg-white rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500 italic mb-2">No classes assigned to you yet.</p>
              <p className="text-sm text-blue-600">Admin needs to assign classes in Configuration.</p>
            </div>
          ) : (
            myClasses.map((cls) => (
              <div key={cls.id} className="bg-white border hover:border-blue-500 rounded-xl p-4 md:p-6 shadow-sm transition-all group">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900">{cls.course.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <MapPin size={16}/> {cls.slot.room.name}
                    </div>
                  </div>
                  <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase self-start">
                    {cls.slot.days}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm border-t pt-4 mt-2 gap-2">
                  <div className="flex items-center gap-1.5 font-mono text-gray-600">
                    <Clock size={16}/>
                    {new Date(cls.slot.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })}
                  </div>

                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Users size={16}/>
                    {cls._count.enrollments} Students
                  </div>
                </div>

                {/* Quick Action Button */}
                <Link
                  href={`/teacher/attendance/${cls.id}`}
                  className="mt-4 w-full bg-gray-900 text-white py-3 md:py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity md:opacity-100 md:group-hover:bg-gray-800"
                >
                  Mark Attendance <ArrowRight size={16} />
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </PageLayout>
  )
}

function StatCard({ label, value }: { label: string, value: string | number }) {
  return (
    <div className="bg-white p-4 md:p-6 rounded-xl border shadow-sm text-center">
      <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-1">{value}</div>
      <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">{label}</div>
    </div>
  )
}