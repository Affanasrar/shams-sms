'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Clock, User, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
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
 const [sendingVoucher, setSendingVoucher] = useState(false)
 const [voucherStatus, setVoucherStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

 const handleSendVoucher = async () => {
 setSendingVoucher(true)
 setVoucherStatus(null)

 try {
 const res = await fetch('/api/admin/fees/send-voucher', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ feeId }),
 })

 const data = await res.json()

 if (res.ok && data.success) {
 const channelLabel = data.channelUsed === 'WHATSAPP' ? 'WhatsApp' : 'SMS Fallback'
 setVoucherStatus({ type: 'success', text: `PDF Voucher sent via ${channelLabel}` })
 } else {
 setVoucherStatus({ type: 'error', text: data.error || 'Failed to send PDF voucher' })
 }
 } catch (err) {
 setVoucherStatus({ type: 'error', text: err instanceof Error ? err.message : 'Network error' })
 } finally {
 setSendingVoucher(false)
 setTimeout(() => setVoucherStatus(null), 5000)
 }
 }

 return (
 <>
 <tr className="group transition hover:bg-muted/80 ">
 {/* Due Date */}
 <td className="px-6 py-4">
 <span className="font-semibold text-rose-600 dark:text-rose-400">
 {new Date(dueDate).toLocaleDateString('en-US', { timeZone: 'Asia/Karachi', month: 'short', day: 'numeric', year: 'numeric' })}
 </span>
 </td>

 {/* Student */}
 <td className="px-6 py-4">
 <div className="font-semibold text-foreground ">{studentName}</div>
 <div className="text-xs text-muted-foreground ">{studentCode} · s/o {fatherName}</div>
 {voucherStatus && (
 <div className={`mt-1 inline-flex items-center gap-1 text-[11px] font-semibold ${
 voucherStatus.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
 }`}>
 {voucherStatus.type === 'success' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
 <span>{voucherStatus.text}</span>
 </div>
 )}
 </td>

 {/* Course / Timing */}
 <td className="px-6 py-4">
 <div className="font-medium text-foreground ">{courseName}</div>
 <div className="text-xs text-muted-foreground ">{timingLabel}</div>
 </td>

 {/* Balance */}
 <td className="px-6 py-4">
 <div className="font-semibold text-foreground ">PKR {finalAmount.toLocaleString()}</div>
 <div className="text-xs text-rose-600 dark:text-rose-400">Due: PKR {remainingAmount.toLocaleString()}</div>
 {paidAmount > 0 && (
 <div className="text-xs text-emerald-600 dark:text-emerald-400">Paid: PKR {paidAmount.toLocaleString()}</div>
 )}
 </td>

 {/* Actions */}
 <td className="px-6 py-4">
 <div className="flex items-center justify-end gap-2">
 {/* 1-Click WhatsApp PDF Voucher Button */}
 <button
 onClick={handleSendVoucher}
 disabled={sendingVoucher}
 className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 transition hover:bg-indigo-100 dark:hover:bg-indigo-900/60 disabled:opacity-50"
 title="Send PDF Fee Voucher directly to student via WhatsApp"
 >
 {sendingVoucher ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
 {sendingVoucher ? 'Sending PDF…' : 'Voucher (PDF)'}
 </button>

 {transactions.length > 0 && (
 <button
 onClick={() => setExpanded(e => !e)}
 className="inline-flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted "
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
 <td colSpan={5} className="bg-muted/80 px-6 py-4 border-b border-border ">
 <div className="flex items-center gap-2 mb-3">
 <Clock size={14} className="text-muted-foreground" />
 <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground ">
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
 <div className="h-2 w-2 rounded-full bg-emerald-50 dark:bg-emerald-950/400 shrink-0" />
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
 <span className="text-xs text-muted-foreground shrink-0">
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
