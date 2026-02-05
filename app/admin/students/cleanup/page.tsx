// app/admin/students/cleanup/page.tsx
'use client'

import { useActionState, useState } from 'react'
import { searchStudentAction, deleteStudentFeesAction } from '@/app/actions/student-cleanup'
import { Trash2, Search, User, DollarSign, Calendar, CreditCard } from 'lucide-react'

interface Fee {
  id: string
  amount: any // Decimal from Prisma
  discountAmount: any
  finalAmount: any
  paidAmount: any
  rolloverAmount: any
  dueDate: string | Date
  status: string
  cycleDate: string | Date
  transactions: Array<{
    id: string
    amount: any
    date: string | Date
    collectedBy: {
      firstName: string | null
      lastName: string | null
    }
  }>
  enrollment?: {
    courseOnSlot: {
      course: {
        name: string
      }
      slot: {
        room: {
          name: string
        }
      }
    }
  } | null
}

interface StudentData {
  student: {
    id: string
    studentId: string
    name: string
    fatherName: string
    phone: string
    admission: string | Date
  }
  fees: Fee[]
  summary: {
    totalFees: number
    totalTransactions: number
    totalAmount: number
    totalPaid: number
    totalOutstanding: number
  }
}

export default function StudentCleanupPage() {
  const [searchState, searchAction, searchPending] = useActionState(searchStudentAction, null)
  const [deleteState, deleteAction, deletePending] = useActionState(deleteStudentFeesAction, null)
  const [studentData, setStudentData] = useState<StudentData | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Update student data when search completes successfully
  if (searchState?.success && searchState.data && !studentData) {
    setStudentData(searchState.data)
  }

  // Clear student data when delete completes
  if (deleteState?.success) {
    setStudentData(null)
    setConfirmDelete(false)
  }

  const handleNewSearch = () => {
    setStudentData(null)
    setConfirmDelete(false)
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Trash2 className="h-8 w-8 text-red-600" />
        <div>
          <h1 className="text-3xl font-bold">Student Fees Cleanup</h1>
          <p className="text-gray-600">Search for a student and manage their fees and transactions</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Search Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Student
          </h2>
          <form action={searchAction} className="space-y-4">
            <div>
              <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-1">
                Student ID
              </label>
              <input
                id="studentId"
                name="studentId"
                placeholder="e.g., SCI-2601-001"
                required
                onChange={handleNewSearch}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={searchPending}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {searchPending ? 'Searching...' : 'Search Student'}
            </button>
          </form>

          {searchState && !searchState.success && (
            <div className="mt-4 p-4 border border-red-200 bg-red-50 rounded-md">
              <p className="text-red-800">{searchState.error}</p>
            </div>
          )}
        </div>

        {/* Student Information */}
        {studentData && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Student Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Student ID</label>
                <p className="text-lg font-semibold">{studentData.student.studentId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Name</label>
                <p className="text-lg">{studentData.student.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Father's Name</label>
                <p>{studentData.student.fatherName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Phone</label>
                <p>{studentData.student.phone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Admission Date</label>
                <p>{new Date(studentData.student.admission).toLocaleDateString('en-US', { timeZone: 'Asia/Karachi' })}</p>
              </div>
            </div>
          </div>
        )}

        {/* Summary Statistics */}
        {studentData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{studentData.summary.totalFees}</p>
                  <p className="text-xs text-gray-500">Total Fees</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{studentData.summary.totalTransactions}</p>
                  <p className="text-xs text-gray-500">Transactions</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">PKR {studentData.summary.totalAmount.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Total Amount</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">PKR {studentData.summary.totalOutstanding.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Outstanding</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fees List */}
        {studentData && studentData.fees.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Fees Details</h2>
            <div className="space-y-4">
              {studentData.fees.map((fee) => (
                <div key={fee.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">
                          {new Date(fee.cycleDate).toLocaleDateString('en-US', {
                            month: 'short',
                            year: 'numeric',
                            timeZone: 'Asia/Karachi'
                          })}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          fee.status === 'PAID' ? 'bg-green-100 text-green-800' :
                          fee.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {fee.status}
                        </span>
                      </div>
                      {fee.enrollment && (
                        <p className="text-sm text-gray-600">
                          {fee.enrollment.courseOnSlot.course.name} • {fee.enrollment.courseOnSlot.slot.room.name}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">PKR {Number(fee.finalAmount).toLocaleString()}</p>
                      <p className="text-sm text-gray-500">
                        Due: {new Date(fee.dueDate).toLocaleDateString('en-US', { timeZone: 'Asia/Karachi' })}
                      </p>
                    </div>
                  </div>

                  {fee.transactions.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Transactions:</p>
                      <div className="space-y-1">
                        {fee.transactions.map((transaction) => (
                          <div key={transaction.id} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                            <span>
                              PKR {Number(transaction.amount).toLocaleString()} •
                              {new Date(transaction.date).toLocaleDateString('en-US', { timeZone: 'Asia/Karachi' })}
                            </span>
                            <span className="text-gray-600">
                              {transaction.collectedBy.firstName || ''} {transaction.collectedBy.lastName || ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {studentData && !confirmDelete && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-red-800">Danger Zone</h2>
            <p className="text-red-700 mb-4">
              This action will permanently delete all fees and transactions for student{' '}
              <strong>{studentData.student.name} ({studentData.student.studentId})</strong>.
              This cannot be undone.
            </p>
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 flex items-center justify-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete All Fees & Transactions
            </button>
          </div>
        )}

        {/* Delete Form */}
        {studentData && confirmDelete && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-red-800">Confirm Deletion</h2>
            <p className="text-red-700 mb-4">
              Are you absolutely sure you want to delete{' '}
              <strong>{studentData.summary.totalFees} fees</strong> and{' '}
              <strong>{studentData.summary.totalTransactions} transactions</strong> for{' '}
              <strong>{studentData.student.name}</strong>?
            </p>
            <p className="text-red-700 mb-6">
              Total amount that will be removed: <strong>PKR {studentData.summary.totalAmount.toLocaleString()}</strong>
            </p>

            <form action={deleteAction} className="space-y-4">
              <input type="hidden" name="studentId" value={studentData.student.studentId} />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={deletePending}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletePending ? 'Deleting...' : 'Yes, Delete Everything'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>

            {deleteState && !deleteState.success && 'error' in deleteState && (
              <div className="mt-4 p-4 border border-red-200 bg-red-50 rounded-md">
                <p className="text-red-800">{deleteState.error}</p>
              </div>
            )}

            {deleteState && deleteState.success && 'message' in deleteState && (
              <div className="mt-4 p-4 border border-green-200 bg-green-50 rounded-md">
                <p className="text-green-800">{deleteState.message}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}