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

  // ✅ ROLE VERIFICATION: Ensure user is a teacher, not an admin
  if (dbUser.role !== 'TEACHER') {
    console.warn(`Unauthorized teacher access attempt by ${email} with role ${dbUser.role}`)
    redirect("/")
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
      <section className="premium-panel overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 text-white sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-200">Teacher portal</p>
            <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">Hello, {dbUser.firstName || "Teacher"}! Your day is ready.</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">Move through your classes, attendance, and reports with clarity and calm.</p>
          </div>
          <Link href="/teacher/reports" className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20">
            <FileText size={16} /> Reports
          </Link>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="My classes" value={myClasses.length} />
        <StatCard label="Active students" value={myClasses.reduce((acc, c) => acc + c._count.enrollments, 0)} />
        <StatCard label="Pending exams" value="0" />
      </div>

      <div className="premium-panel p-6">
        <div className="mb-5 flex items-center gap-2">
          <Clock className="text-indigo-600" />
          <h2 className="text-xl font-semibold tracking-tight">My teaching schedule</h2>
        </div>

        <div className="grid gap-4 md:gap-6">
          {myClasses.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <p className="text-slate-500">No classes assigned to you yet.</p>
              <p className="mt-2 text-sm text-indigo-600">An admin needs to assign your classes first.</p>
            </div>
          ) : (
            myClasses.map((cls) => (
              <div key={cls.id} className="group rounded-[24px] border border-slate-200 bg-white/90 p-5 shadow-[0_16px_50px_-24px_rgba(15,23,42,0.35)] transition hover:-translate-y-0.5 hover:border-indigo-300">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{cls.course.name}</h3>
                    <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                      <MapPin size={16} /> {cls.slot.room.name}
                    </div>
                  </div>
                  <span className="self-start rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-indigo-700">
                    {cls.slot.days}
                  </span>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 font-mono">
                    <Clock size={16} />
                    {new Date(cls.slot.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={16} /> {cls._count.enrollments} students
                  </div>
                </div>

                <Link href={`/teacher/attendance/${cls.id}`} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800">
                  Mark attendance <ArrowRight size={16} />
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
    <div className="premium-panel p-5 text-center">
      <div className="text-2xl font-semibold text-indigo-600 sm:text-3xl">{value}</div>
      <div className="mt-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">{label}</div>
    </div>
  )
}