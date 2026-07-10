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
          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
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
                  className="rounded-full border border-white/15 px-3 py-1 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Remaining</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(remainingAmount)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Status</p>
                  <p className="mt-1 text-lg font-semibold text-emerald-700">Ready to collect</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Mode</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">Partial or full</p>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-900">Payment amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={remainingAmount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
                  autoFocus
                />
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Quick amounts</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {quickAmounts.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setPaymentAmount(amount.toString())}
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
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
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>

              <p className="text-xs text-slate-500">
                This will update the fee status immediately and record the transaction.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}