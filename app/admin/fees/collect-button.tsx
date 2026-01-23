// app/admin/fees/collect-button.tsx
'use client'

import { collectFee } from '@/app/actions/finance'
import { useState } from 'react'

export function CollectButton({ feeId, adminId, finalAmount }: { feeId: string, adminId: string, finalAmount: number }) {
  const [loading, setLoading] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [showInput, setShowInput] = useState(false)

  const handlePay = async () => {
    const amount = parseFloat(paymentAmount)
    if (!amount || amount <= 0) {
      alert("Please enter a valid payment amount")
      return
    }
    
    if (amount > finalAmount) {
      alert("Payment amount cannot exceed the final amount due")
      return
    }

    if(!confirm(`Confirm receiving PKR ${amount} payment?`)) return;
    
    setLoading(true)
    const result = await collectFee(feeId, adminId, amount)
    if (!result.success) {
      alert(result.error)
    } else {
      setPaymentAmount('')
      setShowInput(false)
    }
    setLoading(false)
  }

  if (showInput) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="number"
          step="0.01"
          min="0"
          max={finalAmount}
          value={paymentAmount}
          onChange={(e) => setPaymentAmount(e.target.value)}
          placeholder="Amount"
          className="w-20 px-2 py-1 text-xs border rounded"
          autoFocus
        />
        <button 
          onClick={handlePay}
          disabled={loading}
          className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? '...' : 'Pay'}
        </button>
        <button 
          onClick={() => setShowInput(false)}
          className="text-gray-500 hover:text-gray-700 text-xs"
        >
          ✕
        </button>
      </div>
    )
  }

  return (
    <button 
      onClick={() => setShowInput(true)}
      className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-green-700"
    >
      Collect Fee
    </button>
  )
}