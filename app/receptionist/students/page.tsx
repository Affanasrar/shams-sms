import prisma from '@/lib/prisma'
import { PageLayout } from '@/components/ui'
import { ReceptionistStudentList } from '@/components/receptionist/receptionist-student-list'
import { ReceptionistSummaryGrid } from '@/components/receptionist/receptionist-summary-grid'
import { Users, UserPlus, CalendarClock, BadgeCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ReceptionistStudentsPage() {
  const students = await prisma.student.findMany({
    orderBy: { admission: 'desc' }
  })

  const smsEnabled = students.filter((student) => student.smsReminderEnabled).length
  const recentAdmissions = students.filter((student) => {
    const admission = new Date(student.admission)
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    return admission >= cutoff
  }).length

  const safeStudents = students.map((student) => ({
    ...student,
    admission: student.admission.toISOString()
  }))

  return (
    <PageLayout>
      <section className="overflow-hidden rounded-[2rem] border border-slate-900/90 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_34%),linear-gradient(135deg,#020617_0%,#0f172a_50%,#111827_100%)] p-6 text-white shadow-2xl shadow-slate-900/20 md:p-8">
        <div className="space-y-8">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.26em] text-cyan-200">
              <BadgeCheck size={12} />
              Student directory
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">A cleaner admissions workspace for the front desk.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
                Search, review, and manage student admissions without bouncing between noisy screens.
              </p>
            </div>
          </div>

          <ReceptionistSummaryGrid
            items={[
              { label: 'Total students', value: students.length, icon: <Users size={16} /> },
              { label: 'SMS reminders on', value: smsEnabled, icon: <BadgeCheck size={16} /> },
              { label: 'Recent admissions', value: recentAdmissions, icon: <CalendarClock size={16} /> },
              { label: 'Next action', value: safeStudents.length, icon: <UserPlus size={16} />, suffix: 'records' }
            ]}
          />
        </div>
      </section>

      <ReceptionistStudentList students={safeStudents} />
    </PageLayout>
  )
}
