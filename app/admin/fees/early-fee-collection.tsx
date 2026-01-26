// app/admin/fees/early-fee-collection.tsx
'use client'

import { useState } from 'react'
import { Search, User, Calendar, DollarSign, CreditCard } from 'lucide-react'

interface Student {
  id: string
  studentId: string
  name: string
  fatherName: string
  phone: string
  enrollments: {
    id: string
    status: string
    joiningDate: Date
    courseOnSlot: {
      course: {
        name: string
        baseFee: number
        durationMonths: number
      }
    }
    fees: {
      id: string
      amount: number
      discountAmount: number
      finalAmount: number
      paidAmount: number
      dueDate: Date
      status: string
      cycleDate: Date
    }[]
  }[]
}

interface EarlyFeeCollectionProps {
  adminId: string
}

export function EarlyFeeCollection({ adminId }: EarlyFeeCollectionProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(false)
  const [collectingFee, setCollectingFee] = useState<string | null>(null)

  const searchStudents = async () => {
    if (!searchQuery.trim()) return

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/search-students?q=${encodeURIComponent(searchQuery)}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data)
      } else {
        alert('Failed to search students')
      }
    } catch (error) {
      console.error('Search error:', error)
      alert('Error searching students')
    }
    setLoading(false)
  }

  const selectStudent = (student: Student) => {
    setSelectedStudent(student)
    setSearchResults([])
    setSearchQuery('')
  }

  const collectFee = async (feeId: string, amount: number) => {
    if (!confirm(`Confirm collecting PKR ${amount} for this fee?`)) return

    setCollectingFee(feeId)
    try {
      const response = await fetch('/api/admin/collect-fee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feeId, adminId, amount })
      })

      if (response.ok) {
        // Refresh student data
        if (selectedStudent) {
          const updatedResponse = await fetch(`/api/admin/student-fees/${selectedStudent.id}`)
          if (updatedResponse.ok) {
            const updatedStudent = await updatedResponse.json()
            setSelectedStudent(updatedStudent)
          }
        }
        alert('Fee collected successfully!')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to collect fee')
      }
    } catch (error) {
      console.error('Collection error:', error)
      alert('Error collecting fee')
    }
    setCollectingFee(null)
  }

  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="text-blue-600" size={20} />
        <h2 className="text-lg font-semibold">Early Fee Collection</h2>
      </div>

      {/* Search Section */}
      <div className="mb-6">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search by Student ID or Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchStudents()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={searchStudents}
            disabled={loading || !searchQuery.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-4 border rounded-lg max-h-60 overflow-y-auto">
            {searchResults.map((student) => (
              <div
                key={student.id}
                onClick={() => selectStudent(student)}
                className="p-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <User size={16} className="text-gray-500" />
                  <div>
                    <div className="font-medium">{student.name}</div>
                    <div className="text-sm text-gray-500">
                      ID: {student.studentId} • Phone: {student.phone}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Student Details */}
      {selectedStudent && (
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <User className="text-green-600" size={20} />
              <div>
                <h3 className="font-semibold text-lg">{selectedStudent.name}</h3>
                <p className="text-sm text-gray-600">
                  Student ID: {selectedStudent.studentId} • Phone: {selectedStudent.phone}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedStudent(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {/* Enrollments and Fees */}
          <div className="space-y-4">
            {selectedStudent.enrollments.map((enrollment) => (
              <div key={enrollment.id} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="text-blue-600" size={16} />
                  <span className="font-medium">
                    {enrollment.courseOnSlot.course.name}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    enrollment.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                    enrollment.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {enrollment.status}
                  </span>
                </div>

                <div className="space-y-2">
                  {enrollment.fees.map((fee) => (
                    <div key={fee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="font-medium">
                            Due: {new Date(fee.dueDate).toLocaleDateString('en-US', { timeZone: 'Asia/Karachi' })}
                          </div>
                          <div className="text-sm text-gray-600">
                            Cycle: {new Date(fee.cycleDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              timeZone: 'Asia/Karachi'
                            })}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono">
                            PKR {Number(fee.finalAmount).toLocaleString()}
                          </div>
                          {Number(fee.paidAmount) > 0 && (
                            <div className="text-sm text-green-600">
                              Paid: PKR {Number(fee.paidAmount).toLocaleString()}
                            </div>
                          )}
                          {Number(fee.finalAmount) - Number(fee.paidAmount) > 0 && (
                            <div className="text-sm text-red-600">
                              Due: PKR {(Number(fee.finalAmount) - Number(fee.paidAmount)).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          fee.status === 'PAID' ? 'bg-green-100 text-green-800' :
                          fee.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {fee.status}
                        </span>

                        {fee.status !== 'PAID' && (
                          <button
                            onClick={() => collectFee(fee.id, Number(fee.finalAmount) - Number(fee.paidAmount))}
                            disabled={collectingFee === fee.id}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                          >
                            {collectingFee === fee.id ? '...' : 'Collect'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {selectedStudent.enrollments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No enrollments found for this student.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}