// lib/pdf-helpers.tsx
import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { FeeVoucherPdf, FeeVoucherPdfProps } from '@/components/pdf/fee-voucher-pdf'

export async function generateFeeVoucherPdfBuffer(props: FeeVoucherPdfProps): Promise<Buffer> {
  const doc = <FeeVoucherPdf {...props} />
  return await renderToBuffer(doc)
}
