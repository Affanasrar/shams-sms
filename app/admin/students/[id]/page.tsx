// app/admin/students/[id]/page.tsx
import { getStudentProfile } from '@/app/actions/get-student-profile'
import { Phone, Calendar, ArrowLeft, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { unstable_noStore as noStore } from 'next/cache'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { EnrollmentTable } from './enrollment-table'
import prisma from '@/lib/prisma'

interface FeeData {
  id: string
  status: string
  enrollmentId: string | null
  finalAmount: number
  paidAmount: number
  dueDate: string
  enrollment?: {
    courseOnSlot: {
      course: {
        name: string
        code?: string
      }
    }
  } | null
}

interface ResultData {
  id: string
  course: {
    name: string
  }
  attempt: number
  grade?: string
  marks: number
  total: number
}

interface EnrollmentData {
  status: string
}

// 👇 CHANGED: params is now a Promise type
export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  
  // 👇 ADDED: Prevent caching to ensure fresh data
  noStore()
  
  // 👇 ADDED: We must await the params to get the ID
  const { id } = await params; 
  
  const student = await getStudentProfile(id)

  // Fetch SMS reminder logs for this student
  const smsLogs = await prisma.feeReminderLog.findMany({
    where: { studentId: id },
    orderBy: { sentAt: 'desc' },
    take: 50 // Limit to last 50 SMS
  })

  const cleanEnrollments = student.enrollments

  // Calculate Total Outstanding Balance
  const outstandingFees = student.fees.filter((fee: FeeData) => fee.status === 'UNPAID' || fee.status === 'PARTIAL')
  const groupedFees = outstandingFees.reduce((acc: Record<string, FeeData[]>, fee: FeeData) => {
    const key = fee.enrollmentId || 'general'
    if (!acc[key]) acc[key] = []
    acc[key].push(fee)
    return acc
  }, {} as Record<string, FeeData[]>)
  const totalDue = (Object.values(groupedFees) as FeeData[][]).reduce((sum: number, fees: FeeData[]) => {
    fees.sort((a: FeeData, b: FeeData) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
    const latest = fees[0]
    return sum + (Number(latest.finalAmount) - Number(latest.paidAmount))
  }, 0)

  const totalPaid = student.fees.reduce((sum: number, fee: FeeData) => sum + Number(fee.paidAmount), 0)
  const totalFees = student.fees.reduce((sum: number, fee: FeeData) => sum + Number(fee.finalAmount), 0)

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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General Info</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-bold tracking-tight mb-6">Active Enrollments</h2>
            <EnrollmentTable enrollments={cleanEnrollments} />
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
                  {student.fees.map((fee: FeeData) => {
                    const enrollment = fee.enrollment
                    const courseName = enrollment ? enrollment.courseOnSlot.course.name : "General Fee"
                    const courseCode = enrollment ? enrollment.courseOnSlot.course.code || "---" : "---"

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
                          <StatusBadge status={fee.status as "PAID" | "PENDING" | "OVERDUE" | "UNPAID" | "PARTIAL"} />
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
                  {student.results.map((res: ResultData) => (
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
                    <p className="text-lg font-semibold text-emerald-600">
                      {student.enrollments.some((e: EnrollmentData) => e.status === 'ACTIVE') ? 'Active' : 
                       student.enrollments.some((e: EnrollmentData) => e.status === 'COMPLETED') ? 'Completed' : 'Inactive'}
                    </p>
                  </div>
                )}

                <Button variant="outline" className="w-full mt-4">
                  Download Transcript
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Communications Tab */}
        <TabsContent value="communications" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold tracking-tight">SMS History</h2>
            </div>

            {/* SMS Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Total SMS Sent</p>
                <p className="text-2xl font-bold text-blue-700">
                  {smsLogs.filter(log => log.status === 'SENT').length}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600 font-medium">This Week</p>
                <p className="text-2xl font-bold text-green-700">
                  {smsLogs.filter(log => {
                    const logDate = new Date(log.sentAt)
                    const now = new Date()
                    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                    return log.status === 'SENT' && logDate >= weekStart
                  }).length}
                </p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-600 font-medium">Skipped</p>
                <p className="text-2xl font-bold text-yellow-700">
                  {smsLogs.filter(log => log.status === 'SKIPPED').length}
                </p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-red-600 font-medium">Failed</p>
                <p className="text-2xl font-bold text-red-700">
                  {smsLogs.filter(log => log.status === 'FAILED').length}
                </p>
              </div>
            </div>

            {/* SMS Log History */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent SMS Activity</h3>
              
              {smsLogs.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No SMS records found for this student.
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {smsLogs.map((log) => (
                    <div key={log.id} className="border border-border rounded-lg p-4 bg-muted/20">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={log.status === 'SENT' ? 'default' : log.status === 'SKIPPED' ? 'secondary' : 'destructive'}
                            className="text-xs"
                          >
                            {log.status}
                          </Badge>
                          {log.week && (
                            <span className="text-xs text-muted-foreground">Week: {log.week}</span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(log.sentAt)}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-700 mb-2">
                        {log.details}
                      </div>
                      
                      {log.error && (
                        <div className="text-sm text-red-600 mb-2">
                          Error: {log.error}
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground">
                        Fee IDs: {log.feeIds.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}