// app/admin/fees/collect-button.tsx
'use client'

import { collectFee } from '@/app/actions/finance'
import { useState } from 'react'

function formatCurrency(amount: number) {
 return `PKR ${amount.toLocaleString()}`
}

export function CollectButton({ feeId, adminId, remainingAmount }: { feeId: string, adminId: string, remainingAmount: number }) {
 const [loading, setLoading] = useState(false)
 const [paymentAmount, setPaymentAmount] = useState('')
 const [showModal, setShowModal] = useState(false)

 const closeModal = () => {
 setPaymentAmount('')
 setShowModal(false)
 }

 const handlePay = async () => {
 const amount = parseFloat(paymentAmount)
 if (!amount || amount <= 0) {
 alert('Please enter a valid payment amount')
 return
 }
 
 if (amount > remainingAmount) {
 alert('Payment amount cannot exceed the remaining balance')
 return
 }

 if (!window.confirm(`Are you sure you want to collect PKR ${amount.toLocaleString()} for this fee?`)) {
 return
 }

 setLoading(true)
 const result = await collectFee(feeId, adminId, amount)
 if (!result.success) {
 alert(result.error)
 } else {
 closeModal()
 }
 setLoading(false)
 }

 const quickAmounts = [
 Math.min(remainingAmount, Math.max(1, Math.round(remainingAmount * 0.25))),
 Math.min(remainingAmount, Math.max(1, Math.round(remainingAmount * 0.5))),
 remainingAmount
 ]

 return (
 <>
 <button 
 onClick={() => setShowModal(true)}
 className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md"
 >
 Collect Fee
 </button>

 {showModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
 <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-card shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
 <div className="bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-5 text-white">
 <div className="flex items-start justify-between gap-4">
 <div>
 <p className="text-xs uppercase tracking-[0.3em] text-white/60">Fee collection</p>
 <h2 className="mt-2 text-2xl font-semibold">Collect payment</h2>
 <p className="mt-2 text-sm text-white/70">
 Enter the amount to receive from the student.
 </p>
 </div>
 <button
 type="button"
 onClick={closeModal}
 className="rounded-full border border-white/15 px-3 py-1 text-sm text-white/70 transition hover:bg-card/10 hover:text-white"
 >
 Close
 </button>
 </div>
 </div>

 <div className="space-y-5 px-6 py-6">
 <div className="grid gap-3 rounded-2xl border border-border bg-muted p-4 sm:grid-cols-3">
 <div>
 <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground ">Remaining</p>
 <p className="mt-1 text-lg font-semibold text-foreground ">{formatCurrency(remainingAmount)}</p>
 </div>
 <div>
 <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground ">Status</p>
 <p className="mt-1 text-lg font-semibold text-emerald-700 dark:text-emerald-400">Ready to collect</p>
 </div>
 <div>
 <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground ">Mode</p>
 <p className="mt-1 text-lg font-semibold text-foreground ">Partial or full</p>
 </div>
 </div>

 <div>
 <label className="mb-2 block text-sm font-medium text-foreground ">Payment amount</label>
 <input
 type="number"
 step="0.01"
 min="0"
 max={remainingAmount}
 value={paymentAmount}
 onChange={(e) => setPaymentAmount(e.target.value)}
 placeholder="Enter amount"
 className="w-full rounded-2xl border border-border bg-muted px-4 py-3 text-sm text-foreground outline-none transition focus:border-slate-400 focus:bg-card dark:focus:bg-slate-900 focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 placeholder:text-muted-foreground dark:placeholder:text-muted-foreground"
 autoFocus
 />
 </div>

 <div>
 <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground ">Quick amounts</p>
 <div className="grid gap-2 sm:grid-cols-3">
 {quickAmounts.map((amount) => (
 <button
 key={amount}
 type="button"
 onClick={() => setPaymentAmount(amount.toString())}
 className="rounded-2xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:border-border hover:bg-muted "
 >
 {formatCurrency(amount)}
 </button>
 ))}
 </div>
 </div>

 <div className="flex flex-col gap-3 sm:flex-row">
 <button 
 onClick={handlePay}
 disabled={loading}
 className="flex-1 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
 >
 {loading ? 'Processing...' : 'Confirm payment'}
 </button>
 <button 
 type="button"
 onClick={closeModal}
 className="rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-muted "
 >
 Cancel
 </button>
 </div>

 <p className="text-xs text-muted-foreground ">
 This will update the fee status immediately and record the transaction.
 </p>
 </div>
 </div>
 </div>
 )}
 </>
 )
}