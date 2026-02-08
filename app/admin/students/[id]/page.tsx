// app/admin/students/[id]/page.tsx
import { getStudentProfile } from '@/app/actions/get-student-profile'
import { Mail, Phone, MapPin, Calendar, DollarSign, BookOpen, TrendingUp, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { unstable_noStore as noStore } from 'next/cache'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ExtendCourseModal } from './extend-course-modal'
import { EnrollmentTable } from './enrollment-table'

// 👇 CHANGED: params is now a Promise type
export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  
  // 👇 ADDED: Prevent caching to ensure fresh data
  noStore()
  
  // 👇 ADDED: We must await the params to get the ID
  const { id } = await params; 
  
  const student = await getStudentProfile(id)

  // Calculate Total Outstanding Balance
  const totalDue = student.fees
    .filter(f => f.status === 'UNPAID' || f.status === 'PARTIAL')
    .reduce((sum, fee) => sum + (Number(fee.finalAmount) - Number(fee.paidAmount)), 0)

  const totalPaid = student.fees.reduce((sum, fee) => sum + Number(fee.paidAmount), 0)
  const totalFees = student.fees.reduce((sum, fee) => sum + Number(fee.finalAmount), 0)

  return (
    <div className="space-y-8">
      {/* Back Navigation */}
      <Link
        href="/admin/students"
        className="inline-flex items-center gap-2 text-primary hover:underline transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Students
      </Link>

      {/* Student Header Card */}
      <Card className="p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                {student.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{student.name}</h1>
                <p className="text-sm text-muted-foreground">ID: {student.studentId}</p>
                <p className="text-sm text-muted-foreground">Father: {student.fatherName}</p>
              </div>
            </div>
          </div>

          {/* Balance Indicator */}
          <div
            className={`p-6 rounded-lg text-center min-w-max ${
              totalDue > 0
                ? 'bg-red-50 border border-red-200'
                : 'bg-emerald-50 border border-emerald-200'
            }`}
          >
            <p className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Current Due</p>
            <p className={`text-3xl font-bold ${totalDue > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {formatCurrency(totalDue)}
            </p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="w-4 h-4" />
            <span>{student.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Joined: {formatDate(student.admission)}</span>
          </div>
        </div>
      </Card>

      {/* Tabbed Interface */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General Info</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-bold tracking-tight mb-6">Active Enrollments</h2>
            <EnrollmentTable enrollments={student.enrollments} />
          </Card>
        </TabsContent>

        {/* Financial Tab - Ledger View */}
        <TabsContent value="financial" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-bold tracking-tight mb-6">Fee Ledger</h2>
            
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Total Due</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(totalFees)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(totalPaid)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Outstanding</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(totalDue)}
                </p>
              </div>
            </div>

            {/* Fee Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold">Course</th>
                    <th className="text-left py-3 px-4 font-semibold">Total Fee</th>
                    <th className="text-left py-3 px-4 font-semibold">Paid</th>
                    <th className="text-left py-3 px-4 font-semibold">Outstanding</th>
                    <th className="text-left py-3 px-4 font-semibold">Due Date</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {student.fees.map((fee) => {
                    const enrollment = fee.enrollment as any
                    const courseName = enrollment ? enrollment.courseOnSlot.course.name : "General Fee"
                    const courseCode = enrollment ? enrollment.courseOnSlot.course.code : "---"

                    return (
                      <tr key={fee.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{courseName}</p>
                            <p className="text-xs text-muted-foreground">{courseCode}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">{formatCurrency(Number(fee.finalAmount))}</td>
                        <td className="py-3 px-4 text-emerald-600 font-medium">{formatCurrency(Number(fee.paidAmount))}</td>
                        <td className="py-3 px-4 text-red-600 font-medium">
                          {formatCurrency(Number(fee.finalAmount) - Number(fee.paidAmount))}
                        </td>
                        <td className="py-3 px-4 text-xs">{formatDate(fee.dueDate)}</td>
                        <td className="py-3 px-4">
                          <StatusBadge status={fee.status as "PAID" | "PENDING" | "OVERDUE" | "UNPAID"} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {student.fees.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                No fee records found for this student.
              </div>
            )}

            {totalDue > 0 && (
              <Button className="mt-6" asChild>
                <Link href={`/admin/fees?student=${student.id}`}>Collect Payment</Link>
              </Button>
            )}
          </Card>
        </TabsContent>

        {/* Academic Tab */}
        <TabsContent value="academic" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Exam Results */}
            <Card className="p-6">
              <h3 className="text-lg font-bold tracking-tight mb-4">🏆 Exam Results</h3>
              {student.results.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No exams taken yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {student.results.map((res) => (
                    <div
                      key={res.id}
                      className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium">{res.course.name}</h4>
                          <p className="text-xs text-muted-foreground">Attempt {res.attempt}</p>
                        </div>
                        <Badge variant="secondary">{res.grade}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          Marks: <span className="font-bold text-foreground">{Number(res.marks)} / {Number(res.total)}</span>
                        </p>
                        <p className="text-sm font-semibold text-primary">
                          {((Number(res.marks) / Number(res.total)) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Student Summary */}
            <Card className="p-6">
              <h3 className="text-lg font-bold tracking-tight mb-4">📊 Summary</h3>
              
              <div className="space-y-4">
                {student.enrollments.length > 0 && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Active Courses</p>
                    <p className="text-2xl font-bold">{student.enrollments.length}</p>
                  </div>
                )}

                {student.results.length > 0 && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Exams Completed</p>
                    <p className="text-2xl font-bold">{student.results.length}</p>
                  </div>
                )}

                {student.fees.length > 0 && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Enrollment Status</p>
                    <p className="text-lg font-semibold text-emerald-600">Active</p>
                  </div>
                )}

                <Button variant="outline" className="w-full mt-4">
                  Download Transcript
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}