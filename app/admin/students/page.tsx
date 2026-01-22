// app/admin/students/page.tsx
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { UserPlus, Search } from 'lucide-react'

export default async function StudentList() {
  const students = await prisma.student.findMany({
    orderBy: { admission: 'desc' },
    take: 50
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Student Directory</h2>
        <Link 
          href="/admin/students/new" 
          className="bg-black text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-800"
        >
          <UserPlus size={18} /> New Admission
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Search by name or phone..." 
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b text-gray-500">
            <tr>
              <th className="px-6 py-3">ID</th>
              <th className="px-6 py-3">Student Name</th>
              <th className="px-6 py-3">Father's Name</th>
              <th className="px-6 py-3">Phone</th>
              <th className="px-6 py-3">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50 group">
                <td className="px-6 py-4 font-mono text-xs text-gray-400">
                  {student.id.slice(0, 8)}...
                </td>
                
                {/* 👇 THIS IS THE UPDATED PART 👇 */}
                <td className="px-6 py-4 font-medium text-gray-900">
                  <Link 
                    href={`/admin/students/${student.id}`} 
                    className="hover:text-blue-600 hover:underline"
                  >
                    {student.name}
                  </Link>
                </td>
                {/* 👆 END OF UPDATED PART 👆 */}

                <td className="px-6 py-4 text-gray-600">{student.fatherName}</td>
                <td className="px-6 py-4 font-mono text-gray-600">{student.phone}</td>
                <td className="px-6 py-4 text-gray-500">
                  {new Date(student.admission).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}