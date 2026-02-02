// app/admin/fees/early-fee-collection.tsx
'use client'

import { useState } from 'react'
import { Search, User, Calendar, DollarSign, CreditCard, Plus, X } from 'lucide-react'

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
      id: string
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
  const [showAdvanceFeeModal, setShowAdvanceFeeModal] = useState(false)
  const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null)
  const [advanceFeeAmount, setAdvanceFeeAmount] = useState('')
  const [addingAdvanceFee, setAddingAdvanceFee] = useState(false)

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

  const addAdvanceFee = async () => {
    if (!selectedEnrollment || !advanceFeeAmount || Number(advanceFeeAmount) <= 0) {
      alert('Please enter a valid amount')
      return
    }

    setAddingAdvanceFee(true)
    try {
      const response = await fetch('/api/admin/add-advance-fee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollmentId: selectedEnrollment.id,
          courseOnSlotId: selectedEnrollment.courseOnSlot.id,
          amount: Number(advanceFeeAmount),
          adminId
        })
      })

      if (response.ok) {
        alert('Advance fee added successfully!')
        setShowAdvanceFeeModal(false)
        setAdvanceFeeAmount('')
        setSelectedEnrollment(null)
        
        // Refresh student data
        if (selectedStudent) {
          const updatedResponse = await fetch(`/api/admin/student-fees/${selectedStudent.id}`)
          if (updatedResponse.ok) {
            const updatedStudent = await updatedResponse.json()
            setSelectedStudent(updatedStudent)
          }
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to add advance fee')
      }
    } catch (error) {
      console.error('Add advance fee error:', error)
      alert('Error adding advance fee')
    }
    setAddingAdvanceFee(false)
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
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
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
                  {enrollment.status === 'ACTIVE' && (
                    <button
                      onClick={() => {
                        setSelectedEnrollment(enrollment)
                        setShowAdvanceFeeModal(true)
                      }}
                      className="flex items-center gap-1 bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition"
                    >
                      <Plus size={14} />
                      Add Advance Fee
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {enrollment.fees && enrollment.fees.length > 0 ? (
                    enrollment.fees.map((fee) => (
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
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No fees generated yet. Use "Add Advance Fee" to create one.
                    </div>
                  )}
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

      {/* Add Advance Fee Modal */}
      {showAdvanceFeeModal && selectedEnrollment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Advance Fee</h3>
              <button
                onClick={() => {
                  setShowAdvanceFeeModal(false)
                  setSelectedEnrollment(null)
                  setAdvanceFeeAmount('')
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course
                </label>
                <p className="text-gray-800 font-medium">
                  {selectedEnrollment.courseOnSlot.course.name}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base Course Fee
                </label>
                <p className="text-gray-800 font-medium">
                  PKR {Number(selectedEnrollment.courseOnSlot.course.baseFee).toLocaleString()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Advance Fee Amount *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="number"
                    placeholder="Enter amount in PKR"
                    value={advanceFeeAmount}
                    onChange={(e) => setAdvanceFeeAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    step="1"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
                <p className="font-medium mb-1">ℹ️ About Advance Fee</p>
                <p>
                  This fee will be created immediately with a due date of tomorrow. 
                  You can collect it right away or later.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowAdvanceFeeModal(false)
                    setSelectedEnrollment(null)
                    setAdvanceFeeAmount('')
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={addAdvanceFee}
                  disabled={addingAdvanceFee || !advanceFeeAmount || Number(advanceFeeAmount) <= 0}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
                >
                  {addingAdvanceFee ? 'Adding...' : 'Add Fee'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}