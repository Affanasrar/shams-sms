import { EnrollmentForm, type CourseOnSlot } from '@/app/admin/enrollment/new/enrollment-form'
import { getEnrollmentOptions } from '@/app/actions/fetch-options'
import Link from 'next/link'
import { ArrowLeft, BookOpen } from 'lucide-react'
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-sky-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/receptionist" className="inline-flex items-center gap-2 text-cyan-600 hover:text-cyan-700 font-medium transition-colors mb-6">
            <ArrowLeft size={18} />
            Back to Receptionist Home
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-cyan-100 rounded-lg">
                  <BookOpen className="w-6 h-6 text-cyan-600" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900">Student Enrollment</h1>
              </div>
              <p className="text-slate-600">Select an admitted student and assign them to the right course slot in one fast flow.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-slate-100">
          <div className="bg-gradient-to-r from-cyan-600 to-sky-600 px-6 py-4">
            <p className="text-white font-medium">Quick Enrollment Workspace</p>
          </div>
          <div className="p-8">
            <EnrollmentForm students={data.students} assignments={safeAssignments} />
          </div>
        </div>

        <div className="mt-8 p-4 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-600">
            Tip: Use the search box to pick the student faster and then select the course timing slot with visible seat availability.
          </p>
        </div>
      </div>
    </div>
  )
}
