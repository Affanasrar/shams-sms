import prisma from '@/lib/prisma'
import { PageLayout } from '@/components/ui'
import { ReceptionistEnrollmentList } from '@/components/receptionist/receptionist-enrollment-list'
import { ReceptionistSummaryGrid } from '@/components/receptionist/receptionist-summary-grid'
import { BadgeCheck, BookOpen, CalendarClock, Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ReceptionistEnrollmentsPage() {
  const enrollments = await prisma.enrollment.findMany({
    where: { status: 'ACTIVE' },
    include: {
      student: true,
      courseOnSlot: {
        include: {
          course: true,
          slot: { include: { room: true } }
        }
      }
    },
    orderBy: { joiningDate: 'desc' }
  })

  const safeEnrollments = enrollments.map((enrollment) => ({
    id: enrollment.id,
    enrollmentId: enrollment.id,
    studentId: enrollment.student.studentId,
    studentName: enrollment.student.name,
    fatherName: enrollment.student.fatherName,
    phone: enrollment.student.phone,
    courseName: enrollment.courseOnSlot.course.name,
    slotDays: enrollment.courseOnSlot.slot.days,
    slotTime: `${new Date(enrollment.courseOnSlot.slot.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })} - ${new Date(enrollment.courseOnSlot.slot.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Karachi' })}`,
    roomName: enrollment.courseOnSlot.slot.room.name,
    joiningDate: enrollment.joiningDate.toISOString()
  }))

  const activeStudents = new Set(enrollments.map((enrollment) => enrollment.studentId)).size

  return (
    <PageLayout>
      <section className="overflow-hidden rounded-[2rem] border border-slate-900/90 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_34%),linear-gradient(135deg,#020617_0%,#0f172a_50%,#111827_100%)] p-6 text-white shadow-2xl shadow-slate-900/20 md:p-8">
        <div className="space-y-8">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.26em] text-cyan-200">
              <BadgeCheck size={12} />
              Enrollment desk
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">Enrollment records, cleaned up for the front desk.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
                Search active students by course, room, or student name without sifting through a dense table.
              </p>
            </div>
          </div>

          <ReceptionistSummaryGrid
            items={[
              { label: 'Active enrollments', value: enrollments.length, icon: <BookOpen size={16} /> },
              { label: 'Students covered', value: activeStudents, icon: <Users size={16} /> },
              {
                label: 'Latest join date',
                value: enrollments[0] ? new Date(enrollments[0].joiningDate).toLocaleDateString('en-US', { timeZone: 'Asia/Karachi' }) : '—',
                icon: <CalendarClock size={16} />
              },
              { label: 'View mode', value: 'Searchable', icon: <BadgeCheck size={16} /> }
            ]}
          />
        </div>
      </section>

      <ReceptionistEnrollmentList enrollments={safeEnrollments} />
    </PageLayout>
  )
}
