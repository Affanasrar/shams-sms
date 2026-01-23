// app/admin/students/[id]/page.tsx
import { getStudentProfile } from '@/app/actions/get-student-profile'
import { CheckCircle, Clock, DollarSign, BookOpen } from 'lucide-react'
import { unstable_noStore as noStore } from 'next/cache'

// 👇 CHANGED: params is now a Promise type
export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  
  // 👇 ADDED: Prevent caching to ensure fresh data
  noStore()
  
  // 👇 ADDED: We must await the params to get the ID
  const { id } = await params; 
  
  const student = await getStudentProfile(id)

  // Calculate Total Outstanding Balance - FIXED: Use finalAmount - paidAmount instead of amount
  const totalDue = student.fees
    .filter(f => f.status === 'UNPAID' || f.status === 'PARTIAL')
    .reduce((sum, fee) => sum + (Number(fee.finalAmount) - Number(fee.paidAmount)), 0)

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* 1. Header Card (Bio-Data) */}
      <div className="bg-white p-8 rounded-xl border shadow-sm flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{student.name}</h1>
          <p className="text-gray-500 mt-1">Father: {student.fatherName}</p>
          <div className="flex gap-4 mt-4 text-sm text-gray-600 font-mono">
            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">ID: {student.studentId}</span>
            <span>📱 {student.phone}</span>
            <span>📅 Joined: {new Date(student.admission).toLocaleDateString()}</span>
          </div>
        </div>
        
        {/* Balance Indicator */}
        <div className={`text-right p-4 rounded-lg ${totalDue > 0 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          <p className="text-xs uppercase font-bold tracking-wider">Current Due</p>
          <p className="text-3xl font-bold">PKR {totalDue.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 2. Left Column: Academic Journey */}
        <div className="space-y-8 lg:col-span-2">
          
          {/* Active Classes */}
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <BookOpen size={20}/> Course Enrollment History
            </h2>
            <div className="bg-white border rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-4">Course</th>
                    <th className="p-4">Slot</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {student.enrollments.map(enr => (
                    <tr key={enr.id}>
                      <td className="p-4 font-medium">{enr.courseOnSlot.course.name}</td>
                      <td className="p-4 text-gray-500">
                        {enr.courseOnSlot.slot.days} <br/>
                        {new Date(enr.courseOnSlot.slot.startTime).toLocaleTimeString([],{hour:'2-digit', minute:'2-digit'})}
                      </td>
                      <td className="p-4">
                        <StatusBadge status={enr.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Exam Results */}
          <section>
             <h2 className="text-xl font-bold mb-4">🏆 Exam Results</h2>
             {student.results.length === 0 ? (
               <div className="p-6 bg-gray-50 rounded-lg border text-center text-gray-500 italic">
                 No exams taken yet.
               </div>
             ) : (
               <div className="grid gap-4 sm:grid-cols-2">
                 {student.results.map(res => (
                   <div key={res.id} className="bg-white p-4 rounded-lg border shadow-sm">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold">{res.course.name}</h3>
                        <span className="text-xs bg-black text-white px-2 py-1 rounded">
                          Attempt {res.attempt}
                        </span>
                      </div>
                      <div className="mt-4 flex items-end justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Marks</p>
                          <p className="font-mono text-lg">{res.marks.toString()} / {res.total.toString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">{res.grade}</p>
                        </div>
                      </div>
                   </div>
                 ))}
               </div>
             )}
          </section>
        </div>

        {/* 3. Right Column: Financial Ledger */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <DollarSign size={20}/> Financial Ledger
          </h2>
          <div className="bg-white border rounded-lg shadow-sm">
            <div className="p-4 bg-gray-50 border-b text-xs font-medium text-gray-500 uppercase tracking-wide">
              Transaction History
            </div>
            
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {student.fees.map(fee => {
                
                // Safe Cast for TypeScript
                const enrollment = fee.enrollment as any;
                const feeTitle = enrollment ? enrollment.courseOnSlot.course.name : "General Fee";

                return (
                  <div key={fee.id} className="p-4 hover:bg-gray-50 transition">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-sm">
                        {feeTitle}
                      </span>
                      <span className="font-bold text-sm">PKR {Number(fee.finalAmount).toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs mb-2">
                      <span className="text-gray-500">
                        Paid: PKR {Number(fee.paidAmount).toLocaleString()}
                      </span>
                      <span className="text-gray-500">
                        Due: PKR {(Number(fee.finalAmount) - Number(fee.paidAmount)).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">
                        Due: {new Date(fee.dueDate).toLocaleDateString()}
                      </span>
                      
                      {fee.status === 'PAID' ? (
                        <span className="flex items-center gap-1 text-green-700 bg-green-100 px-2 py-0.5 rounded-full font-bold">
                          <CheckCircle size={12} /> PAID
                        </span>
                      ) : fee.status === 'PARTIAL' ? (
                        <span className="flex items-center gap-1 text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full font-bold">
                          <Clock size={12} /> PARTIAL
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-700 bg-red-100 px-2 py-0.5 rounded-full font-bold">
                          <Clock size={12} /> UNPAID
                        </span>
                      )}
                    </div>
                    
                    {fee.transactions.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-dashed text-xs text-gray-400">
                        Paid on {new Date(fee.transactions[0].date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                )
              })}
              
              {student.fees.length === 0 && (
                <div className="p-8 text-center text-gray-500 text-sm">
                  No invoice history found.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    ACTIVE: "bg-green-100 text-green-800",
    COMPLETED: "bg-blue-100 text-blue-800",
    DROPPED: "bg-red-100 text-red-800",
  }
  // @ts-ignore
  const style = styles[status] || "bg-gray-100 text-gray-800"
  return (
    <span className={`px-2 py-1 rounded text-xs font-bold ${style}`}>
      {status}
    </span>
  )
}