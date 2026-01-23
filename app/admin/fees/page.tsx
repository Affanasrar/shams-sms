// app/admin/fees/page.tsx
import prisma from '@/lib/prisma'
import { CollectButton } from './collect-button'

export default async function FeesPage() {
  const dueFees = await prisma.fee.findMany({
    where: { status: 'UNPAID' },
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">💰 Fee Collection</h2>
        <a 
          href="/admin/fees/by-course" 
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium text-sm"
        >
          View by Course
        </a>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-red-50 border-b text-red-900">
            <tr>
              <th className="px-6 py-3">Due Date</th>
              <th className="px-6 py-3">Student</th>
              <th className="px-6 py-3">Course</th>
              <th className="px-6 py-3">Amount</th>
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
                    {new Date(fee.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 font-medium">{fee.student.name}</td>
                  
                  <td className="px-6 py-4 text-gray-500">
                    {courseName}
                  </td>

                  <td className="px-6 py-4 font-mono">
                    PKR {Number(fee.amount).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <CollectButton feeId={fee.id} adminId={adminId} />
                  </td>
                </tr>
              )
            })}
            
            {dueFees.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
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