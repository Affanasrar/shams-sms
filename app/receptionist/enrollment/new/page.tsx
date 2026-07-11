import { EnrollmentForm, type CourseOnSlot } from '@/app/admin/enrollment/new/enrollment-form'
import { getEnrollmentOptions } from '@/app/actions/fetch-options'
import Link from 'next/link'
import { ReceptionistSummaryGrid } from '@/components/receptionist/receptionist-summary-grid'
import { ArrowLeft, BookOpen, BadgeCheck, Sparkles } from 'lucide-react'
import { unstable_noStore as noStore } from 'next/cache'

export const dynamic = 'force-dynamic'

export default async function NewReceptionistEnrollmentPage() {
  noStore()

  const data = await getEnrollmentOptions()

  const safeAssignments = data.assignments.map((assignment) => ({
    ...assignment,
    slot: {
      ...assignment.slot,
      startTime: assignment.slot.startTime instanceof Date
        ? assignment.slot.startTime.toISOString()
        : assignment.slot.startTime,
      endTime: assignment.slot.endTime instanceof Date
        ? assignment.slot.endTime.toISOString()
        : assignment.slot.endTime
    },
    course: {
      ...assignment.course,
      baseFee: Number(assignment.course.baseFee)
    },
    enrollments: (assignment.enrollments || []).map((enrollment) => ({
      ...enrollment,
      joiningDate: enrollment.joiningDate instanceof Date
        ? enrollment.joiningDate.toISOString()
        : enrollment.joiningDate,
      endDate: enrollment.endDate instanceof Date
        ? enrollment.endDate.toISOString()
        : enrollment.endDate
    }))
  })) as CourseOnSlot[]

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-900/90 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_34%),linear-gradient(135deg,#020617_0%,#0f172a_50%,#111827_100%)] p-6 text-white shadow-2xl shadow-slate-900/20 md:p-8">
        <div className="space-y-8">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.26em] text-cyan-200">
              <Sparkles size={12} />
              Enrollment workspace
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">Assign a student to the right course slot in one clean flow.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
                The form below keeps the intake focused while preserving the seat availability and timing context.
              </p>
            </div>
          </div>

          <ReceptionistSummaryGrid
            items={[
              { label: 'Assignments', value: safeAssignments.length, icon: <BookOpen size={16} /> },
              { label: 'Admitted students', value: data.students.length, icon: <BadgeCheck size={16} /> }
            ]}
          />
        </div>
      </section>

      <div className="mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <Link href="/receptionist" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
            <ArrowLeft size={16} />
            Back to dashboard
          </Link>
        </div>
        <div className="border-b border-cyan-100 bg-[linear-gradient(90deg,rgba(6,182,212,0.12),rgba(14,165,233,0.08))] px-6 py-4">
          <p className="text-sm font-medium text-cyan-900">Quick enrollment workspace</p>
        </div>
        <div className="p-6 md:p-8">
          <EnrollmentForm students={data.students} assignments={safeAssignments} />
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 shadow-sm">
        Tip: use the search box to pick the student first, then choose the course timing slot with visible seat availability.
      </div>
    </div>
  )
}

