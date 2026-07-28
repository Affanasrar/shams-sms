'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Clock, User } from 'lucide-react'
import { CollectButton } from './collect-button'

type Transaction = {
  id: string
  date: string
  amount: number
  collectorName: string
}

type Props = {
  feeId: string
  adminId: string
  dueDate: string
  studentName: string
  studentCode: string
  fatherName: string
  courseName: string
  timingLabel: string
  finalAmount: number
  paidAmount: number
  remainingAmount: number
  transactions: Transaction[]
}

export function FeeRow({
  feeId, adminId, dueDate, studentName, studentCode, fatherName,
  courseName, timingLabel, finalAmount, paidAmount, remainingAmount, transactions
}: Props) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <tr className="group transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
        {/* Due Date */}
        <td className="px-6 py-4">
          <span className="font-semibold text-rose-600 dark:text-rose-400">
            {new Date(dueDate).toLocaleDateString('en-US', { timeZone: 'Asia/Karachi', month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </td>

        {/* Student */}
        <td className="px-6 py-4">
          <div className="font-semibold text-slate-900 dark:text-white">{studentName}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{studentCode} · s/o {fatherName}</div>
        </td>

        {/* Course / Timing */}
        <td className="px-6 py-4">
          <div className="font-medium text-slate-900 dark:text-white">{courseName}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{timingLabel}</div>
        </td>

        {/* Balance */}
        <td className="px-6 py-4">
          <div className="font-semibold text-slate-900 dark:text-white">PKR {finalAmount.toLocaleString()}</div>
          <div className="text-xs text-rose-600 dark:text-rose-400">Due: PKR {remainingAmount.toLocaleString()}</div>
          {paidAmount > 0 && (
            <div className="text-xs text-emerald-600 dark:text-emerald-400">Paid: PKR {paidAmount.toLocaleString()}</div>
          )}
        </td>

        {/* Actions */}
        <td className="px-6 py-4">
          <div className="flex items-center justify-end gap-2">
            {transactions.length > 0 && (
              <button
                onClick={() => setExpanded(e => !e)}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-800"
                title="View payment history"
              >
                {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                History ({transactions.length})
              </button>
            )}
            <CollectButton feeId={feeId} adminId={adminId} remainingAmount={remainingAmount} />
          </div>
        </td>
      </tr>

      {/* Expanded payment timeline */}
      {expanded && (
        <tr>
          <td colSpan={5} className="bg-slate-50/80 dark:bg-slate-900/60 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={14} className="text-slate-400" />
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Payment History
              </p>
            </div>
            <div className="space-y-2">
              {transactions.map(t => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                        PKR {t.amount.toLocaleString()} collected
                      </p>
                      <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                        <User size={11} />
                        <span>{t.collectorName}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
                    {new Date(t.date).toLocaleDateString('en-US', {
                      timeZone: 'Asia/Karachi',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    {new Date(t.date).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                      timeZone: 'Asia/Karachi',
                    })}
                  </span>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
