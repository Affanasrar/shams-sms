// app/admin/students/[id]/page.tsx
import { getStudentProfile } from '@/app/actions/get-student-profile'
import { ArrowLeft, MessageSquare, Wallet, BadgeCheck, CreditCard, Edit3 } from 'lucide-react'
import Link from 'next/link'
import { unstable_noStore as noStore } from 'next/cache'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  const activeEnrollments = student.enrollments.filter((enrollment: EnrollmentData) => enrollment.status === 'ACTIVE').length
  const smsEnabled = student.smsReminderEnabled

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-2xl shadow-slate-900/20 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <div className="flex items-center gap-3 text-white/75">
              <Link href="/admin/students" className="rounded-full border border-white/15 p-2 transition hover:bg-white/10 hover:text-white">
                <ArrowLeft size={18} />
              </Link>
              <span className="text-xs uppercase tracking-[0.3em]">Student profile</span>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 text-3xl font-semibold text-white backdrop-blur">
                {student.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{student.name}</h1>
                <p className="mt-2 text-sm text-white/70">{student.studentId} • Father: {student.fatherName}</p>
                <p className="mt-1 text-sm text-white/60">Joined {formatDate(student.admission)}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/admin/students/${student.studentId}/edit`}
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-100"
              >
                <Edit3 size={16} />
                Edit Profile
              </Link>
              <Link
                href={`/admin/fees?studentId=${student.id}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                <CreditCard size={16} />
                Collect Payment
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-lg xl:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">Current due</p>
              <p className={`mt-2 text-3xl font-semibold ${totalDue > 0 ? 'text-rose-300' : 'text-emerald-300'}`}>{formatCurrency(totalDue)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">Active enrollments</p>
              <p className="mt-2 text-3xl font-semibold">{activeEnrollments}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">SMS reminders</p>
              <p className="mt-2 text-lg font-semibold">{smsEnabled ? 'Enabled' : 'Disabled'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">Phone</p>
              <p className="mt-2 text-lg font-semibold">{student.phone || 'Not set'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Total fees</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(totalFees)}</p>
            </div>
            <Wallet className="h-6 w-6 text-slate-500" />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Total paid</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-600">{formatCurrency(totalPaid)}</p>
            </div>
            <BadgeCheck className="h-6 w-6 text-emerald-600" />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Outstanding</p>
              <p className="mt-2 text-2xl font-semibold text-rose-600">{formatCurrency(totalDue)}</p>
            </div>
            <CreditCard className="h-6 w-6 text-rose-600" />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Communications</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{smsLogs.length}</p>
            </div>
            <MessageSquare className="h-6 w-6 text-slate-500" />
          </div>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid h-auto w-full grid-cols-4 gap-2 rounded-2xl bg-slate-100 p-2">
          <TabsTrigger value="general">General Info</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card className="overflow-hidden border-slate-200 p-0 shadow-sm">
            <EnrollmentTable enrollments={cleanEnrollments} />
          </Card>
        </TabsContent>

        {/* Financial Tab - Ledger View */}
        <TabsContent value="financial" className="space-y-6">
          <Card className="overflow-hidden border-slate-200 p-0 shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">Fee Ledger</h2>
              <p className="text-sm text-slate-500">The financial history for this student.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 border-b border-slate-200 p-6 md:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Total Due</p>
                <p className="text-2xl font-semibold text-slate-900">{formatCurrency(totalFees)}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Total Paid</p>
                <p className="text-2xl font-semibold text-emerald-600">{formatCurrency(totalPaid)}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Outstanding</p>
                <p className="text-2xl font-semibold text-rose-600">{formatCurrency(totalDue)}</p>
              </div>
            </div>

            {/* Fee Table */}
            <div className="overflow-x-auto p-6">
              <table className="w-full text-sm">
                <thead className="text-slate-500">
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-3 text-left font-medium">Course</th>
                    <th className="px-4 py-3 text-left font-medium">Total Fee</th>
                    <th className="px-4 py-3 text-left font-medium">Paid</th>
                    <th className="px-4 py-3 text-left font-medium">Outstanding</th>
                    <th className="px-4 py-3 text-left font-medium">Due Date</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {student.fees.map((fee: FeeData) => {
                    const enrollment = fee.enrollment
                    const courseName = enrollment ? enrollment.courseOnSlot.course.name : "General Fee"
                    const courseCode = enrollment ? enrollment.courseOnSlot.course.code || "---" : "---"

                    return (
                      <tr key={fee.id} className="border-b border-slate-100 transition hover:bg-slate-50/70">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-slate-900">{courseName}</p>
                            <p className="text-xs text-slate-500">{courseCode}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">{formatCurrency(Number(fee.finalAmount))}</td>
                        <td className="py-3 px-4 text-emerald-600 font-medium">{formatCurrency(Number(fee.paidAmount))}</td>
                        <td className="py-3 px-4 text-red-600 font-medium">
                          {formatCurrency(Number(fee.finalAmount) - Number(fee.paidAmount))}
                        </td>
                        <td className="py-3 px-4 text-xs">{formatDate(fee.dueDate)}</td>
                        <td className="py-3 px-4">
                          <Badge variant={fee.status === 'PAID' ? 'default' : fee.status === 'PARTIAL' ? 'secondary' : 'destructive'}>
                            {fee.status}
                          </Badge>
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
              <Button className="mt-6 rounded-2xl" asChild>
                <Link href={`/admin/fees?student=${student.id}`}>Collect Payment</Link>
              </Button>
            )}
          </Card>
        </TabsContent>

        {/* Academic Tab */}
        <TabsContent value="academic" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Exam Results */}
            <Card className="overflow-hidden border-slate-200 p-0 shadow-sm">
              <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
                <h3 className="text-lg font-semibold tracking-tight text-slate-900">Exam Results</h3>
              </div>
              {student.results.length === 0 ? (
                <div className="py-8 text-center text-slate-500">
                  No exams taken yet.
                </div>
              ) : (
                <div className="space-y-4 p-6">
                  {student.results.map((res: ResultData) => (
                    <div
                      key={res.id}
                      className="rounded-2xl border border-slate-200 p-4 transition hover:bg-slate-50"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-slate-900">{res.course.name}</h4>
                          <p className="text-xs text-slate-500">Attempt {res.attempt}</p>
                        </div>
                        <Badge variant="secondary">{res.grade}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-500">
                          Marks: <span className="font-semibold text-slate-900">{Number(res.marks)} / {Number(res.total)}</span>
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                          {((Number(res.marks) / Number(res.total)) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Student Summary */}
            <Card className="overflow-hidden border-slate-200 p-0 shadow-sm">
              <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
                <h3 className="text-lg font-semibold tracking-tight text-slate-900">Summary</h3>
              </div>
              
              <div className="space-y-4 p-6">
                {student.enrollments.length > 0 && (
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Active Courses</p>
                    <p className="text-2xl font-bold">{student.enrollments.length}</p>
                  </div>
                )}

                {student.results.length > 0 && (
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Exams Completed</p>
                    <p className="text-2xl font-bold">{student.results.length}</p>
                  </div>
                )}

                {student.fees.length > 0 && (
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Enrollment Status</p>
                    <p className="text-lg font-semibold text-emerald-600">
                      {student.enrollments.some((e: EnrollmentData) => e.status === 'ACTIVE') ? 'Active' : 
                       student.enrollments.some((e: EnrollmentData) => e.status === 'COMPLETED') ? 'Completed' : 'Inactive'}
                    </p>
                  </div>
                )}

                <Button variant="outline" className="mt-4 w-full rounded-2xl">
                  Download Transcript
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Communications Tab */}
        <TabsContent value="communications" className="space-y-6">
          <Card className="overflow-hidden border-slate-200 p-0 shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
            <div className="flex items-center gap-2 mb-6">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold tracking-tight">SMS History</h2>
            </div>
            </div>

            {/* SMS Statistics */}
            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-4">
              <div className="rounded-2xl bg-blue-50 p-4">
                <p className="text-sm font-medium text-blue-600">Total SMS Sent</p>
                <p className="text-2xl font-bold text-blue-700">
                  {smsLogs.filter(log => log.status === 'SENT').length}
                </p>
              </div>
              <div className="rounded-2xl bg-green-50 p-4">
                <p className="text-sm font-medium text-green-600">This Week</p>
                <p className="text-2xl font-bold text-green-700">
                  {smsLogs.filter(log => {
                    const logDate = new Date(log.sentAt)
                    const now = new Date()
                    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                    return log.status === 'SENT' && logDate >= weekStart
                  }).length}
                </p>
              </div>
              <div className="rounded-2xl bg-yellow-50 p-4">
                <p className="text-sm font-medium text-yellow-600">Skipped</p>
                <p className="text-2xl font-bold text-yellow-700">
                  {smsLogs.filter(log => log.status === 'SKIPPED').length}
                </p>
              </div>
              <div className="rounded-2xl bg-red-50 p-4">
                <p className="text-sm font-medium text-red-600">Failed</p>
                <p className="text-2xl font-bold text-red-700">
                  {smsLogs.filter(log => log.status === 'FAILED').length}
                </p>
              </div>
            </div>

            {/* SMS Log History */}
            <div className="space-y-3 px-6 pb-6">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">Recent SMS Activity</h3>
              
              {smsLogs.length === 0 ? (
                <div className="py-8 text-center text-slate-500">
                  No SMS records found for this student.
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {smsLogs.map((log) => (
                    <div key={log.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
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
                        <span className="text-xs text-slate-500">
                          {formatDate(log.sentAt)}
                        </span>
                      </div>
                      
                      <div className="mb-2 text-sm text-slate-700">
                        {log.details}
                      </div>
                      
                      {log.error && (
                        <div className="mb-2 text-sm text-red-600">
                          Error: {log.error}
                        </div>
                      )}
                      
                      <div className="text-xs text-slate-500">
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