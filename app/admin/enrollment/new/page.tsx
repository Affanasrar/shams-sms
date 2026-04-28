// app/admin/enrollment/new/page.tsx
import { EnrollmentForm } from './enrollment-form'
import { getEnrollmentOptions } from '@/app/actions/fetch-options'
import Link from 'next/link'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { unstable_noStore as noStore } from 'next/cache'

// 👇 FIX: Force fresh data so newly created students appear in the dropdown
export const dynamic = 'force-dynamic'

export default async function NewEnrollmentPage() {
  // 👇 Also add noStore() for extra safety
  noStore()
  
  const data = await getEnrollmentOptions()

  // 👇 FIX: Convert 'Decimal' objects to plain 'Numbers' and normalize data
  // This cleans the data so the Client Component can read it without crashing.
  const safeAssignments = data.assignments.map((assignment) => ({
    ...assignment,
    course: {
      ...assignment.course,
      baseFee: Number(assignment.course.baseFee) // Convert Decimal -> Number
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
  }))
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/enrollment" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors mb-6">
            <ArrowLeft size={18} />
            Back to Enrollments
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">New Enrollment</h1>
              </div>
              <p className="text-gray-600">Complete the steps below to enroll a student in a course</p>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
            <p className="text-white font-medium">Step-by-step Enrollment Process</p>
          </div>
          
          <div className="p-8">
            {/* Pass 'safeAssignments' instead of 'data.assignments' */}
            <EnrollmentForm students={data.students} assignments={safeAssignments} />
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Need help?</span> Ensure the student is registered in the system and has not already been enrolled in the selected course slot.
          </p>
        </div>
      </div>
    </div>
  )
}