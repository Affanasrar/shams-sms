// app/admin/enrollment/page.tsx
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { Plus, Trash2 } from 'lucide-react'
import { dropStudent } from '@/app/actions/enrollment' // 👈 IMPORT THE ACTION

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
          className="bg-black text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-gray-800 transition"
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
              <tr key={record.id} className="hover:bg-gray-50 group">
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
                
                {/* 👇 THE WORKING DROP ACTION */}
                {/* 👇 REPLACE THIS TABLE CELL */}
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
                  <p className="mb-2">No active students found.</p>
                  <Link href="/admin/enrollment/new" className="text-blue-600 hover:underline">
                    Enroll your first student
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}