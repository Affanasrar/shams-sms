// app/admin/enrollment/page.tsx
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function EnrollmentIndex() {
  // Fetch only ACTIVE enrollments for the list
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Active Enrollments</h2>
        <Link 
          href="/admin/enrollment/new" 
          className="bg-black text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-gray-800"
        >
          <Plus size={16} /> New Enrollment
        </Link>
      </div>

      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b text-gray-500">
            <tr>
              <th className="px-6 py-3">Student Name</th>
              <th className="px-6 py-3">Course</th>
              <th className="px-6 py-3">Slot / Room</th>
              <th className="px-6 py-3">Joined</th>
              <th className="px-6 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {enrollments.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{record.student.name}</td>
                <td className="px-6 py-4">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">
                    {record.courseOnSlot.course.name}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {record.courseOnSlot.slot.days} <br/>
                  {new Date(record.courseOnSlot.slot.startTime).toLocaleTimeString([],{hour:'2-digit', minute:'2-digit'})}
                  <span className="text-xs text-gray-400 ml-1">
                    ({record.courseOnSlot.slot.room.name})
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {new Date(record.joiningDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-red-600 hover:underline">Drop</button>
                </td>
              </tr>
            ))}
            {enrollments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No active students found. Click "New Enrollment" to start.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}