'use client'

import { useState } from 'react'
import { RotateCcw, Clock, X, AlertCircle } from 'lucide-react'
import { reEnrollStudent, extendDroppedStudent } from '@/app/actions/dropped-students'

type Props = {
 enrollmentId: string
 studentId: string
 studentName: string
 courseName: string
 droppedDate: Date
 dropReason: 'duration' | 'admin'
}

type ActionState = {
 success: boolean
 message?: string
 error?: string
}

const initialState: ActionState = { success: false }

export function DroppedStudentRowActions({
 enrollmentId,
 studentId,
 studentName,
 courseName,
 droppedDate,
 dropReason,
}: Props) {
 const [isReEnrollModalOpen, setIsReEnrollModalOpen] = useState(false)
 const [isExtendModalOpen, setIsExtendModalOpen] = useState(false)
 const [extendDays, setExtendDays] = useState<number>(30)
 const [state, setState] = useState<ActionState>(initialState)
 const [isLoading, setIsLoading] = useState(false)

 const handleReEnroll = async (extendDays?: number) => {
 setIsLoading(true)
 try {
 const result = await reEnrollStudent(enrollmentId, { extendDays })
 setState({ success: true, message: 'Student re-enrolled successfully!' })

 setTimeout(() => {
 setIsReEnrollModalOpen(false)
 setState(initialState)
 window.location.reload()
 }, 2000)
 } catch (error) {
 setState({
 success: false,
 error: error instanceof Error ? error.message : 'Failed to re-enroll student',
 })
 } finally {
 setIsLoading(false)
 }
 }

 const handleExtend = async () => {
 if (!extendDays || extendDays <= 0) {
 setState({
 success: false,
 error: 'Please enter a valid number of days',
 })
 return
 }

 setIsLoading(true)
 try {
 const result = await extendDroppedStudent(enrollmentId, extendDays)
 setState({ success: true, message: `Enrollment extended by ${extendDays} days` })

 setTimeout(() => {
 setIsExtendModalOpen(false)
 setExtendDays(30)
 setState(initialState)
 window.location.reload()
 }, 2000)
 } catch (error) {
 setState({
 success: false,
 error: error instanceof Error ? error.message : 'Failed to extend enrollment',
 })
 } finally {
 setIsLoading(false)
 }
 }

 return (
 <>
 {/* Action Buttons */}
 <div className="flex items-center gap-2">
 <button
 onClick={() => {
 setIsReEnrollModalOpen(true)
 setState(initialState)
 }}
 className="inline-flex items-center gap-1.5 text-green-600 dark:text-green-300 hover:text-white hover:bg-green-600 px-3 py-1.5 rounded-md transition-all font-medium text-xs border border-transparent hover:border-green-700"
 title="Re-enroll Student"
 >
 <RotateCcw size={14} /> Re-enroll
 </button>

 <button
 onClick={() => {
 setIsExtendModalOpen(true)
 setState(initialState)
 }}
 className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-300 hover:text-white hover:bg-blue-600 px-3 py-1.5 rounded-md transition-all font-medium text-xs border border-transparent hover:border-blue-700"
 title="Extend Duration"
 >
 <Clock size={14} /> Extend
 </button>
 </div>

 {/* Re-enroll Modal */}
 {isReEnrollModalOpen && (
 <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
 <div className="card-surface p-6 max-w-md w-full ">
 <div className="flex justify-between items-start mb-4">
 <div>
 <h2 className="text-xl font-bold text-foreground ">Re-enroll Student</h2>
 <p className="text-sm text-muted-foreground mt-1">
 Bring back {studentName}
 </p>
 </div>
 <button
 onClick={() => setIsReEnrollModalOpen(false)}
 className="p-2 hover:bg-muted rounded-lg transition text-muted-foreground"
 >
 <X size={20} />
 </button>
 </div>

 {/* Dropped Information */}
 <div className={`rounded-xl p-4 mb-6 border ${dropReason === 'duration' ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50' : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/50'}`}>
 <div className="flex gap-3">
 <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${dropReason === 'duration' ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`} />
 <div className="text-sm">
 <p className={`font-medium ${dropReason === 'duration' ? 'text-amber-900 dark:text-amber-200' : 'text-rose-900 dark:text-rose-200'}`}>
 {dropReason === 'duration' ? '📅 Dropped Due to Course Duration' : '🚫 Manually Dropped by Admin'}
 </p>
 <p className={`mt-1 text-xs ${dropReason === 'duration' ? 'text-amber-700 dark:text-amber-300' : 'text-rose-700 dark:text-rose-300'}`}>
 {dropReason === 'duration' 
 ? 'This student completed their course duration. Re-enrolling will give them a fresh start with new fees.'
 : 'This student was manually dropped by an administrator. Re-enrolling will restore them to active status.'}
 </p>
 </div>
 </div>
 </div>

 {/* Enrollment Details */}
 <div className="bg-muted rounded-xl p-4 mb-6 border border-border ">
 <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Enrollment Details</p>
 <div className="space-y-1.5 text-sm">
 <p className="text-muted-foreground ">
 Student: <span className="font-semibold text-foreground ">{studentName}</span>
 </p>
 <p className="text-muted-foreground ">
 Course: <span className="font-semibold text-foreground ">{courseName}</span>
 </p>
 </div>
 </div>

 {/* Status Messages */}
 {state.error && (
 <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 px-4 py-3 rounded-xl mb-4 text-sm">
 {state.error}
 </div>
 )}

 {state.success && (
 <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 px-4 py-3 rounded-xl mb-4 text-sm">
 {state.message}
 </div>
 )}

 {/* Action Buttons */}
 <div className="flex gap-3">
 <button
 onClick={() => handleReEnroll()}
 disabled={isLoading}
 className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-xl disabled:opacity-50 transition font-medium text-sm"
 >
 {isLoading ? 'Re-enrolling...' : 'Yes, Re-enroll'}
 </button>
 <button
 type="button"
 onClick={() => setIsReEnrollModalOpen(false)}
 className="flex-1 px-4 py-2 text-muted-foreground hover:text-foreground transition font-medium text-sm"
 >
 Cancel
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Extend Duration Modal */}
 {isExtendModalOpen && (
 <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
 <div className="card-surface p-6 max-w-md w-full ">
 <div className="flex justify-between items-start mb-4">
 <div>
 <h2 className="text-xl font-bold text-foreground ">Extend Duration</h2>
 <p className="text-sm text-muted-foreground mt-1">
 Extend {studentName}&apos;s enrollment period
 </p>
 </div>
 <button
 onClick={() => setIsExtendModalOpen(false)}
 className="p-2 hover:bg-muted rounded-lg transition text-muted-foreground"
 >
 <X size={20} />
 </button>
 </div>

 {/* Info */}
 <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/50 rounded-xl p-4 mb-6">
 <p className="text-xs text-sky-900 dark:text-sky-300">
 Extend the enrollment period without re-enrolling. This updates the end date for record keeping.
 </p>
 </div>

 {/* Days Input */}
 <div className="mb-6">
 <label className="block text-sm font-medium text-foreground mb-1">
 Days to Extend
 </label>
 <input
 type="number"
 min="1"
 max="365"
 value={extendDays}
 onChange={(e) => setExtendDays(parseInt(e.target.value) || 0)}
 className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 "
 placeholder="Enter number of days"
 />
 <p className="text-xs text-muted-foreground mt-1">
 Default is 30 days (1 month)
 </p>
 </div>

 {/* Status Messages */}
 {state.error && (
 <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 px-4 py-3 rounded-xl mb-4 text-sm">
 {state.error}
 </div>
 )}

 {state.success && (
 <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 px-4 py-3 rounded-xl mb-4 text-sm">
 {state.message}
 </div>
 )}

 {/* Action Buttons */}
 <div className="flex gap-3">
 <button
 onClick={handleExtend}
 disabled={isLoading || !extendDays}
 className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-xl disabled:opacity-50 transition font-medium text-sm"
 >
 {isLoading ? 'Extending...' : 'Extend Duration'}
 </button>
 <button
 type="button"
 onClick={() => {
 setIsExtendModalOpen(false)
 setExtendDays(30)
 setState(initialState)
 }}
 className="flex-1 px-4 py-2 text-muted-foreground hover:text-foreground transition font-medium text-sm"
 >
 Cancel
 </button>
 </div>
 </div>
 </div>
 )}
 </>
 )
}
