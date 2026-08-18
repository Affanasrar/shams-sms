import { getEnrollmentOptions } from '@/app/actions/fetch-options'
import { StreamlinedAdmissionForm } from '@/app/admin/students/new/StreamlinedAdmissionForm'
import Link from 'next/link'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { unstable_noStore as noStore } from 'next/cache'

export default async function ReceptionistAdmissionPage() {
  noStore()
  const data = await getEnrollmentOptions()

  const safeAssignments = data.assignments.map((assignment: any) => ({
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
    }
  }))

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Receptionist Header Banner */}
      <section className="overflow-hidden rounded-[2rem] border border-slate-900/90 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_34%),linear-gradient(135deg,#020617_0%,#0f172a_50%,#111827_100%)] p-6 text-white shadow-2xl shadow-slate-900/20 md:p-8">
        <div className="space-y-4">
          <div>
            <Link
              href="/receptionist/students"
              className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-300 transition hover:text-cyan-200 mb-3"
            >
              <ArrowLeft size={14} />
              Back to Student Directory
            </Link>
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.26em] text-cyan-200">
                <Sparkles size={12} />
                Receptionist Intake Desk
              </div>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-4xl">
              Student Admission & Intake
            </h1>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-300 md:text-sm">
              Capture new admissions with optional 1-step course placement, live room seat checks, and fee collection.
            </p>
          </div>
        </div>
      </section>

      <StreamlinedAdmissionForm assignments={safeAssignments as any} basePath="/receptionist" />
    </div>
  )
}
