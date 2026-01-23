// app/admin/enrollment/page.tsx
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { Plus, Trash2 } from 'lucide-react'
import { dropStudent } from '@/app/actions/enrollment'
import { EnrollmentFilters } from './enrollment-filters'

// 👇 Define the props type correctly for Next.js 15+
type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function EnrollmentIndex(props: Props) {
  // 1. 👇 AWAIT the searchParams (Critical Fix)
  const searchParams = await props.searchParams
  
  const courseId = searchParams.courseId as string | undefined
  const slotId = searchParams.slotId as string | undefined

  // 2. Fetch Filter Options
  const courses = await prisma.course.findMany({ orderBy: { name: 'asc' } })
  const slots = await prisma.slot.findMany({
    include: { room: true },
    orderBy: { startTime: 'asc' }
  })

  // 3. Build Dynamic Query
  // We start with the base requirement: Status must be ACTIVE
  const whereClause: any = { 
    status: 'ACTIVE'
  }

  // If a Course is selected, add it to the filter
  if (courseId) {
    whereClause.courseOnSlot = { courseId: courseId }
  }

  // If a Slot is selected, add it to the filter
  if (slotId) {
    if (whereClause.courseOnSlot) {
      whereClause.courseOnSlot.slotId = slotId
    } else {
      whereClause.courseOnSlot = { slotId: slotId }
    }
  }

  // 4. Fetch Enrollments
  const enrollments = await prisma.enrollment.findMany({
    where: whereClause,
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Active Enrollments</h2>
        <Link 
          href="/admin/enrollment/new" 
          className="bg-black text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-gray-800 transition"
        >
          <Plus size={16} /> New Enrollment
        </Link>
      </div>

      {/* Render the Filters */}
      <EnrollmentFilters courses={courses} slots={slots} />

      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold">{enrollments.length}</span> enrollment{enrollments.length !== 1 ? 's' : ''}
            {(courseId || slotId) && (
              <span> • 
                {courseId && ` Course: ${courses.find(c => c.id === courseId)?.name}`}
                {courseId && slotId && ' •'}
                {slotId && ` Slot: ${slots.find(s => s.id === slotId)?.days}`}
              </span>
            )}
          </p>
          {(courseId || slotId) && (
            <Link
              href="/admin/enrollment"
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Clear filters
            </Link>
          )}
        </div>
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b text-gray-500">
            <tr>
              <th className="px-6 py-3">Student ID</th>
              <th className="px-6 py-3">Student Name</th>
              <th className="px-6 py-3">Course</th>
              <th className="px-6 py-3">Slot / Room</th>
              <th className="px-6 py-3">Joined</th>
              <th className="px-6 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {enrollments.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50 group">
                <td className="px-6 py-4 font-mono text-xs text-blue-600 font-medium">
                  {record.student.studentId}
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">
                  {record.student.name}
                  <div className="text-xs text-gray-500 font-normal">{record.student.fatherName}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded text-xs font-bold border border-blue-200">
                    {record.courseOnSlot.course.name}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600">
                  <div className="font-medium text-gray-900">{record.courseOnSlot.slot.days}</div>
                  <div className="flex items-center gap-1 text-xs">
                    {new Date(record.courseOnSlot.slot.startTime).toLocaleTimeString([],{hour:'2-digit', minute:'2-digit'})}
                    <span>•</span>
                    <span className="text-gray-500">{record.courseOnSlot.slot.room.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {new Date(record.joiningDate).toLocaleDateString()}
                </td>
                
                <td className="px-6 py-4 text-right">
                  <form 
                    action={async (formData) => {
                      "use server"
                      await dropStudent(formData)
                    }}
                  >
                    <input type="hidden" name="enrollmentId" value={record.id} />
                    
                    <button 
                      type="submit"
                      className="inline-flex items-center gap-1.5 text-red-600 hover:text-white hover:bg-red-600 px-3 py-1.5 rounded-md transition-all font-medium text-xs border border-transparent hover:border-red-700"
                      title="Drop Student from Class"
                    >
                      <Trash2 size={14} /> Drop
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            
            {enrollments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  <p className="mb-2 text-lg">No students found for this filter.</p>
                  <p className="text-sm">Try clearing filters or checking other classes.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}