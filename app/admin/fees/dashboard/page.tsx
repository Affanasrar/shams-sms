// app/admin/fees/dashboard/page.tsx
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, FileText, Download, Calendar, Users, DollarSign } from 'lucide-react'
import { FeesDashboard } from './fees-dashboard'

export default async function FeesDashboardPage() {
  // Get current month and year for default view
  const now = new Date()
  const currentMonth = now.getMonth() + 1 // JavaScript months are 0-based
  const currentYear = now.getFullYear()

  // Fetch summary data
  const [
    totalStudents,
    totalFeesThisMonth,
    paidFeesThisMonth,
    pendingFeesThisMonth,
    courses
  ] = await Promise.all([
    prisma.student.count(),
    prisma.fee.aggregate({
      where: {
        cycleDate: {
          gte: new Date(currentYear, currentMonth - 1, 1),
          lt: new Date(currentYear, currentMonth, 1)
        }
      },
      _sum: { finalAmount: true }
    }),
    prisma.fee.aggregate({
      where: {
        cycleDate: {
          gte: new Date(currentYear, currentMonth - 1, 1),
          lt: new Date(currentYear, currentMonth, 1)
        },
        status: { in: ['PAID', 'PARTIAL'] }
      },
      _sum: { paidAmount: true }
    }),
    prisma.fee.aggregate({
      where: {
        cycleDate: {
          gte: new Date(currentYear, currentMonth - 1, 1),
          lt: new Date(currentYear, currentMonth, 1)
        },
        status: { in: ['UNPAID', 'PARTIAL'] }
      },
      _sum: {
        finalAmount: true,
        paidAmount: true
      }
    }),
    prisma.course.findMany({
      select: { id: true, name: true }
    })
  ])

  const pendingAmount = Number(totalFeesThisMonth._sum.finalAmount || 0) -
                       Number(paidFeesThisMonth._sum.paidAmount || 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fees Dashboard</h1>
            <p className="text-gray-500">Comprehensive fees management and reporting</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            href="/admin/fees"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <DollarSign size={16} />
            Collect Fees
          </Link>
          <Link
            href="/admin/fees/reports"
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
          >
            <FileText size={16} />
            Generate Reports
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Fees This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                PKR {(totalFeesThisMonth._sum.finalAmount || 0).toLocaleString()}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Collected This Month</p>
              <p className="text-2xl font-bold text-green-600">
                PKR {(paidFeesThisMonth._sum.paidAmount || 0).toLocaleString()}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending This Month</p>
              <p className="text-2xl font-bold text-red-600">
                PKR {pendingAmount.toLocaleString()}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Main Dashboard Component */}
      <FeesDashboard courses={courses} />
    </div>
  )
}