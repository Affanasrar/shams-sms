// app/admin/enrollment/new/page.tsx
import { EnrollmentForm } from './enrollment-form'
import { getEnrollmentOptions } from '@/app/actions/fetch-options'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { unstable_noStore as noStore } from 'next/cache'

// 👇 FIX: Force fresh data so newly created students appear in the dropdown
export const dynamic = 'force-dynamic'

export default async function NewEnrollmentPage() {
  // 👇 Also add noStore() for extra safety
  noStore()
  
  const data = await getEnrollmentOptions()

  // 👇 FIX: Convert 'Decimal' objects to plain 'Numbers'
  // This cleans the data so the Client Component can read it without crashing.
  const safeAssignments = data.assignments.map((assignment) => ({
    ...assignment,
    course: {
      ...assignment.course,
      baseFee: Number(assignment.course.baseFee) // Convert Decimal -> Number
    }
  }))
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/enrollment" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft size={20} />
          Back to Enrollments
        </Link>
      </div>
      
      <h1 className="text-2xl font-bold mb-6">📝 New Student Enrollment</h1>
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        {/* Pass 'safeAssignments' instead of 'data.assignments' */}
        <EnrollmentForm students={data.students} assignments={safeAssignments} />
      </div>
    </div>
  )
}