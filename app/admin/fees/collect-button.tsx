// app/admin/fees/collect-button.tsx
'use client'

import { collectFee } from '@/app/actions/finance'
import { useState } from 'react'

export function CollectButton({ feeId, adminId }: { feeId: string, adminId: string }) {
  const [loading, setLoading] = useState(false)

  const handlePay = async () => {
    if(!confirm("Confirm receiving cash payment?")) return;
    
    setLoading(true)
    const result = await collectFee(feeId, adminId)
    if (!result.success) alert(result.error)
    setLoading(false)
  }

  return (
    <button 
      onClick={handlePay}
      disabled={loading}
      className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-green-700 disabled:opacity-50"
    >
      {loading ? 'Processing...' : 'Mark Paid'}
    </button>
  )
}