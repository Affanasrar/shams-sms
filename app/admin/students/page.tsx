// app/admin/students/page.tsx
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { UserPlus, Search } from 'lucide-react'

// 👇 Define the props type correctly for Next.js 15+
type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function StudentList(props: Props) {
  // 1. 👇 AWAIT the searchParams
  const searchParams = await props.searchParams
  const searchQuery = searchParams.q as string | undefined

  // 2. Build Dynamic Query
  const whereClause: any = {}
  
  if (searchQuery && searchQuery.trim()) {
    whereClause.OR = [
      { name: { contains: searchQuery, mode: 'insensitive' } },
      { studentId: { contains: searchQuery, mode: 'insensitive' } },
      { phone: { contains: searchQuery, mode: 'insensitive' } },
      { fatherName: { contains: searchQuery, mode: 'insensitive' } }
    ]
  }

  const students = await prisma.student.findMany({
    where: whereClause,
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

      <form method="GET" className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input 
          type="text" 
          name="q"
          placeholder="Search by name, student ID, phone, or father's name..." 
          defaultValue={searchQuery || ''}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
        />
      </form>

      <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {searchQuery ? (
                <>Found <span className="font-semibold">{students.length}</span> student{students.length !== 1 ? 's' : ''} matching "<span className="font-medium">{searchQuery}</span>"</>
              ) : (
                <>Showing <span className="font-semibold">{students.length}</span> student{students.length !== 1 ? 's' : ''}</>
              )}
            </p>
            {searchQuery && (
              <Link 
                href="/admin/students"
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Clear search
              </Link>
            )}
          </div>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b text-gray-500">
            <tr>
              <th className="px-6 py-3">Student ID</th>
              <th className="px-6 py-3">Student Name</th>
              <th className="px-6 py-3">Father's Name</th>
              <th className="px-6 py-3">Phone</th>
              <th className="px-6 py-3">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50 group">
                <td className="px-6 py-4 font-mono text-xs text-blue-600 font-medium">
                  {student.studentId}
                </td>
                
                {/* 👇 THIS IS THE UPDATED PART 👇 */}
                <td className="px-6 py-4 font-medium text-gray-900">
                  <Link 
                    href={`/admin/students/${student.studentId}`} 
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
        
        {students.length === 0 && (
          <div className="px-6 py-12 text-center">
            <div className="text-gray-400 mb-2">
              <Search size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              {searchQuery ? 'No students found' : 'No students yet'}
            </h3>
            <p className="text-gray-500">
              {searchQuery 
                ? `No students match "${searchQuery}". Try a different search term.`
                : 'Get started by adding your first student.'
              }
            </p>
            {searchQuery && (
              <div className="mt-4">
                <Link 
                  href="/admin/students"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Clear search and view all students
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}