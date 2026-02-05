// app/admin/fees/page.tsx
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { CollectButton } from './collect-button'
import { EarlyFeeCollection } from './early-fee-collection'
import { ArrowLeft } from 'lucide-react'

export default async function FeesPage({ searchParams }: { searchParams: { studentId?: string, search?: string } }) {
  const studentId = searchParams.studentId
  const search = searchParams.search

  // Build where clause
  const whereClause: any = { status: 'UNPAID' }
  
  if (studentId) {
    whereClause.student = { id: studentId }
  } else if (search) {
    whereClause.OR = [
      { student: { name: { contains: search, mode: 'insensitive' } } },
      { student: { studentId: { contains: search, mode: 'insensitive' } } },
      { student: { fatherName: { contains: search, mode: 'insensitive' } } }
    ]
  }

  const dueFees = await prisma.fee.findMany({
    where: whereClause,
    include: {
      student: true,
      enrollment: {
        include: { courseOnSlot: { include: { course: true } } }
      }
    },
    orderBy: { dueDate: 'asc' }
  })

  // 👇 SELF-HEALING FIX: Find Admin, or Create one if missing
  let admin = await prisma.user.findFirst({ where: { role: 'ADMIN' }})
  
  if (!admin) {
    console.log("⚠️ No Admin found. Creating default 'Super Admin'...")
    admin = await prisma.user.create({
      data: {
        firstName: "Super", 
        lastName: "Admin",
        email: "admin@shams.com",
        role: 'ADMIN',
        clerkId: "manual_admin_001", // This satisfies the unique constraint
        
        // ❌ REMOVED: username (Not in schema)
        // ❌ REMOVED: password (Not in schema)
      }
    })
  }
  
  const adminId = admin.id
  // 👆 END OF FIX

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link 
          href="/admin/fees/dashboard"
          className="text-gray-600 hover:text-gray-900 transition"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Fee Collection</h1>
          <p className="text-gray-500 text-sm">
            {studentId 
              ? `Fees for ${dueFees.length > 0 ? dueFees[0].student.name : 'this student'}`
              : 'View and collect fees from students'
            }
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <a 
          href="/admin/fees/by-course" 
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium text-sm"
        >
          View by Course
        </a>
        <a 
          href="/admin/fees/discounts" 
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-medium text-sm"
        >
          Manage Discounts
        </a>
      </div>

      <EarlyFeeCollection adminId={adminId} />

      <div className="bg-white border rounded-lg p-4 shadow-sm">
        <form method="GET" className="flex gap-2">
          <input
            type="text"
            name="search"
            placeholder="Search by Student Name, ID, or Father Name"
            defaultValue={search || ''}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
          >
            Search
          </button>
        </form>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-red-50 border-b text-red-900">
            <tr>
              <th className="px-6 py-3">Due Date</th>
              <th className="px-6 py-3">Student ID</th>
              <th className="px-6 py-3">Student</th>
              <th className="px-6 py-3">Father Name</th>
              <th className="px-6 py-3">Course</th>
              <th className="px-6 py-3">Fee Details</th>
              <th className="px-6 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {dueFees.map((fee) => {
              
              // Safe Cast for TypeScript
              const enrollment = fee.enrollment as any;
              const courseName = enrollment ? enrollment.courseOnSlot.course.name : "General Fee";

              return (
                <tr key={fee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-bold text-red-600">
                    {new Date(fee.dueDate).toLocaleDateString('en-US', { timeZone: 'Asia/Karachi' })}
                  </td>
                  <td className="px-6 py-4 font-medium">{fee.student.studentId}</td>
                  <td className="px-6 py-4 font-medium">{fee.student.name}</td>
                  <td className="px-6 py-4 font-medium">{fee.student.fatherName}</td>
                  
                  <td className="px-6 py-4 text-gray-500">
                    {courseName}
                  </td>

                  <td className="px-6 py-4 font-mono">
                    <div className="font-bold">PKR {Number(fee.finalAmount).toLocaleString()}</div>
                    {Number(fee.rolloverAmount) > 0 && (
                      <div className="text-xs text-orange-600">
                        (PKR {Number(fee.rolloverAmount).toLocaleString()} from previous month)
                      </div>
                    )}
                    {Number(fee.paidAmount) > 0 && (
                      <div className="text-xs text-green-600">
                        Paid: PKR {Number(fee.paidAmount).toLocaleString()}
                      </div>
                    )}
                    {Number(fee.finalAmount) - Number(fee.paidAmount) > 0 && (
                      <div className="text-xs text-red-600 font-medium">
                        Due: PKR {(Number(fee.finalAmount) - Number(fee.paidAmount)).toLocaleString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <CollectButton feeId={fee.id} adminId={adminId} finalAmount={Number(fee.finalAmount)} />
                  </td>
                </tr>
              )
            })}
            
            {dueFees.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  ✅ No pending fees. Good job!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}