import Link from 'next/link'
import prisma from '@/lib/prisma'
import { ReceptionistSummaryGrid } from '@/components/receptionist/receptionist-summary-grid'
import { ArrowRight, BadgeCheck, BookOpen, CalendarDays, Layers3, Sparkles, UserPlus, Users, CalendarClock } from 'lucide-react'
import { unstable_noStore as noStore } from 'next/cache'

const actionCards = [
  {
    href: '/receptionist/students/new',
    title: 'Register new students',
    description: 'Capture admission details in a clean intake flow.',
    icon: <UserPlus size={20} />
  },
  {
    href: '/receptionist/enrollment/new',
    title: 'Enroll students fast',
    description: 'Assign courses and timing slots from one workspace.',
    icon: <BookOpen size={20} />
  },
  {
    href: '/receptionist/schedule',
    title: 'See room schedules',
    description: 'Review seats, timings, and occupancy at a glance.',
    icon: <CalendarDays size={20} />
  }
]

export default async function ReceptionistHomePage() {
  noStore()

  const [students, activeEnrollments, recentAdmissions, roomAssignments] = await Promise.all([
    prisma.student.count(),
    prisma.enrollment.count({ where: { status: 'ACTIVE' } }),
    prisma.student.count({ where: { admission: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
    prisma.courseOnSlot.count()
  ])

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-900/90 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.2),transparent_34%),linear-gradient(135deg,#020617_0%,#0f172a_50%,#111827_100%)] p-6 text-white shadow-2xl shadow-slate-900/20 md:p-8">
        <div className="space-y-8">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.26em] text-cyan-200">
              <Sparkles size={12} />
              Receptionist portal
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">Admissions, enrollments, and schedules in one focused workspace.</h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
                Move faster at the front desk with a dashboard built for fast lookups, clean intake, and room visibility.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/receptionist/students/new" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">
                <UserPlus size={16} />
                New admission
              </Link>
              <Link href="/receptionist/enrollment/new" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10">
                <BookOpen size={16} />
                New enrollment
              </Link>
            </div>
          </div>

          <ReceptionistSummaryGrid
            items={[
              { label: 'Students', value: students, icon: <Users size={16} /> },
              { label: 'Active enrollments', value: activeEnrollments, icon: <BadgeCheck size={16} /> },
              { label: 'Recent admissions', value: recentAdmissions, icon: <CalendarClock size={16} /> },
              { label: 'Room assignments', value: roomAssignments, icon: <Layers3 size={16} /> }
            ]}
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {actionCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-lg"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 transition group-hover:bg-cyan-100">
                  {card.icon}
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">{card.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
                </div>
              </div>
              <ArrowRight className="mt-1 text-slate-300 transition group-hover:translate-x-1 group-hover:text-cyan-700" size={18} />
            </div>
          </Link>
        ))}
      </section>
    </div>
  )
}

