// app/teacher/page.tsx
import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation" // 👈 Import redirect
import prisma from "@/lib/prisma"
import { Clock, Users, MapPin, ArrowRight } from "lucide-react"
import Link from "next/link"

export default async function TeacherDashboard() {
  const { userId } = await auth()
  const user = await currentUser()

  // 1. 👇 FIX: If not logged in, force redirect to Sign In
  if (!userId || !user) {
    redirect("/sign-in")
  }

  const email = user.emailAddresses[0].emailAddress

  // 2. Find the Database User
  // We check by Email OR ClerkId to catch both cases
  let dbUser = await prisma.user.findFirst({
    where: {
      OR: [
        { clerkId: userId },
        { email: email }
      ]
    }
  })

  // 3. 👇 SELF-HEALING: Link Real Clerk Account to Database User
  // If we found the user by Email, but the ClerkID in the DB is the "fake" one, update it!
  if (dbUser && dbUser.clerkId !== userId) {
    console.log("🔗 Linking Clerk User to Database User...")
    dbUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: { clerkId: userId } // Save the REAL ID
    })
  }

  if (!dbUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
        <p className="text-gray-600">
          Your email <span className="font-mono bg-gray-100 px-2 py-1 rounded">{email}</span> is not registered as a Teacher.
        </p>
        <p className="text-sm text-gray-500">
          (As Admin, go to <strong>Configuration</strong> and assign yourself as a teacher first.)
        </p>
      </div>
    )
  }

  // 4. Fetch Classes Assigned to This Teacher
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
    <div className="max-w-5xl mx-auto space-y-8">
      
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 p-8 rounded-2xl text-white shadow-lg">
        <h1 className="text-3xl font-bold">Hello, {dbUser.firstName || "Teacher"}! 👋</h1>
        <p className="text-blue-100 mt-2">Ready to inspire some minds today?</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="My Classes" value={myClasses.length} />
        <StatCard label="Active Students" value={myClasses.reduce((acc, c) => acc + c._count.enrollments, 0)} />
        <StatCard label="Pending Exams" value="0" />
      </div>

      {/* Class List */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Clock className="text-blue-600"/> My Teaching Schedule
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {myClasses.length === 0 ? (
            <div className="col-span-2 text-center p-12 bg-white rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500 italic mb-2">No classes assigned to you yet.</p>
              <p className="text-sm text-blue-600">Go to Admin Configuration to assign classes.</p>
            </div>
          ) : (
            myClasses.map((cls) => (
              <div key={cls.id} className="bg-white border hover:border-blue-500 rounded-xl p-6 shadow-sm transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{cls.course.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <MapPin size={16}/> {cls.slot.room.name}
                    </div>
                  </div>
                  <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase">
                    {cls.slot.days}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm border-t pt-4 mt-2">
                  <div className="flex items-center gap-1.5 font-mono text-gray-600">
                    <Clock size={16}/>
                    {new Date(cls.slot.startTime).toLocaleTimeString([],{hour:'2-digit', minute:'2-digit'})}
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Users size={16}/>
                    {cls._count.enrollments} Students
                  </div>
                </div>

                {/* Quick Action Button */}
                <Link 
                  href={`/teacher/attendance/${cls.id}`}
                  className="mt-4 w-full bg-gray-900 text-white py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Mark Attendance <ArrowRight size={16} />
                </Link>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  )
}

function StatCard({ label, value }: { label: string, value: string | number }) {
  return (
    <div className="bg-white p-6 rounded-xl border shadow-sm text-center">
      <div className="text-3xl font-bold text-blue-600 mb-1">{value}</div>
      <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">{label}</div>
    </div>
  )
}