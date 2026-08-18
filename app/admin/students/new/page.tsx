import { getEnrollmentOptions } from '@/app/actions/fetch-options'
import { StreamlinedAdmissionForm } from './StreamlinedAdmissionForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { unstable_noStore as noStore } from 'next/cache'

export default async function NewStudentPage() {
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
      {/* Header Banner */}
      <div className="rounded-[32px] border border-border/80 bg-card/80 p-6 shadow-sm backdrop-blur-xl sm:p-8">
        <div className="flex flex-col gap-2">
          <Link
            href="/admin/students"
            className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 transition hover:text-indigo-700"
          >
            <ArrowLeft size={16} />
            Back to Students Directory
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            🎓 Student Admission & Onboarding
          </h1>
          <p className="text-sm text-muted-foreground">
            Complete student admission in a single guided form, with optional course timing assignment and fee collection.
          </p>
        </div>
      </div>

      <StreamlinedAdmissionForm assignments={safeAssignments as any} basePath="/admin" />
    </div>
  )
}