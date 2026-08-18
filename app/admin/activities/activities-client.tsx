// app/admin/activities/activities-client.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ClipboardList, Search } from 'lucide-react'

type Activity = {
 id: string
 type: 'enrollment' | 'fee' | 'drop' | 'expense' | 'system'
 message: string
 timestamp: string
 time: string
 action: string
 userName?: string | null
}

type Props = {
 initialActivities: Activity[]
}

export default function ActivitiesClient({ initialActivities }: Props) {
 const [searchTerm, setSearchTerm] = useState('')
 const [currentPage, setCurrentPage] = useState(1)
 const pageSize = 25

 // Filter across the whole dataset
 const filteredActivities = initialActivities.filter(act => {
 if (!searchTerm.trim()) return true
 const q = searchTerm.toLowerCase()
 return (
 act.message.toLowerCase().includes(q) ||
 act.action.toLowerCase().includes(q) ||
 (act.userName && act.userName.toLowerCase().includes(q))
 )
 })

 const totalPages = Math.ceil(filteredActivities.length / pageSize)
 const startIndex = (currentPage - 1) * pageSize
 const endIndex = Math.min(startIndex + pageSize, filteredActivities.length)
 const pagedActivities = filteredActivities.slice(startIndex, endIndex)

 return (
 <div className="space-y-6">
 {/* Header */}
 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
 <div className="flex items-center gap-3">
 <Link
 href="/admin"
 className="rounded-full border border-border p-2 text-muted-foreground hover:bg-muted transition"
 >
 <ArrowLeft size={18} />
 </Link>
 <div>
 <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
 <ClipboardList className="text-indigo-600 dark:text-indigo-400" size={28} />
 Audit Trails & Activity Logs
 </h1>
 <p className="text-sm text-muted-foreground mt-0.5">
 Comprehensive log of all system actions (Showing 25 per page)
 </p>
 </div>
 </div>
 <div className="rounded-full bg-slate-900 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
 {filteredActivities.length} Records
 </div>
 </div>

 {/* Search Bar */}
 <div className="card-surface p-4 ">
 <div className="relative">
 <Search className="absolute left-3.5 top-2.5 text-muted-foreground" size={18} />
 <input
 type="text"
 placeholder="Search audit logs across entire database..."
 value={searchTerm}
 onChange={(e) => {
 setSearchTerm(e.target.value)
 setCurrentPage(1)
 }}
 className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2 text-sm outline-none focus:border-indigo-500 "
 />
 </div>
 </div>

 {/* Activity Table */}
 <div className="card-surface overflow-hidden ">
 <div className="divide-y divide-slate-200 dark:divide-slate-800">
 {pagedActivities.length === 0 ? (
 <div className="p-12 text-center text-muted-foreground ">
 No activity logs match your search.
 </div>
 ) : (
 pagedActivities.map((activity) => (
 <div key={activity.id} className="p-4 sm:p-5 flex items-start gap-4 hover:bg-muted transition">
 <div
 className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${
 activity.type === 'fee'
 ? 'bg-emerald-50 dark:bg-emerald-950/400'
 : activity.type === 'drop'
 ? 'bg-rose-50 dark:bg-rose-950/400'
 : activity.type === 'expense'
 ? 'bg-amber-50 dark:bg-amber-950/400'
 : 'bg-indigo-50 dark:bg-indigo-950/400'
 }`}
 />
 <div className="flex-1 min-w-0">
 <p className="text-sm font-semibold text-foreground ">{activity.message}</p>
 <p className="text-xs text-muted-foreground mt-1">
 {new Date(activity.timestamp).toLocaleString('en-PK', {
 day: 'numeric',
 month: 'short',
 year: 'numeric',
 hour: '2-digit',
 minute: '2-digit',
 hour12: true
 })}
 {activity.userName && ` • By: ${activity.userName}`}
 </p>
 </div>
 <span
 className={`text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0 border ${
 activity.type === 'fee'
 ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
 : activity.type === 'drop'
 ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/50'
 : activity.type === 'expense'
 ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50'
 : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50'
 }`}
 >
 {activity.action.replace(/_/g, ' ')}
 </span>
 </div>
 ))
 )}
 </div>

 {/* Pagination Footer */}
 {filteredActivities.length > 0 && (
 <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border px-6 py-4 text-sm text-muted-foreground ">
 <div>
 Showing <span className="font-semibold text-foreground ">{startIndex + 1}</span> to{' '}
 <span className="font-semibold text-foreground ">{endIndex}</span> of{' '}
 <span className="font-semibold text-foreground ">{filteredActivities.length}</span> logs
 </div>

 <div className="flex items-center gap-2">
 <button
 onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
 disabled={currentPage === 1}
 className="px-3.5 py-1.5 rounded-xl border border-border bg-card text-foreground disabled:opacity-40 text-xs font-medium transition hover:bg-muted"
 >
 Previous
 </button>
 <span className="text-xs font-medium px-2 text-foreground ">
 Page {currentPage} of {totalPages}
 </span>
 <button
 onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
 disabled={currentPage >= totalPages}
 className="px-3.5 py-1.5 rounded-xl border border-border bg-card text-foreground disabled:opacity-40 text-xs font-medium transition hover:bg-muted"
 >
 Next
 </button>
 </div>
 </div>
 )}
 </div>
 </div>
 )
}
