// components/pdf/fee-voucher-pdf.tsx
import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import fs from 'fs'
import path from 'path'

// Get logo as Base64 Data URL for server-side PDF rendering
const getLogoBase64 = (): string | null => {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'assets', 'images', 'logo.png')
    if (fs.existsSync(logoPath)) {
      const buffer = fs.readFileSync(logoPath)
      return `data:image/png;base64,${buffer.toString('base64')}`
    }
  } catch (err) {
    console.warn('Could not load logo.png for PDF:', err)
  }
  return null
}

const logoBase64 = getLogoBase64()

const styles = StyleSheet.create({
  page: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0a192f',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  logoImage: {
    width: 44,
    height: 44,
    objectFit: 'contain',
  },
  institutionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  institutionSubtitle: {
    fontSize: 7.5,
    color: '#cbd5e1',
    marginTop: 2,
    lineHeight: 1.3,
  },
  voucherBadge: {
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  voucherBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  metaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  metaItem: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  metaLabel: {
    fontSize: 7.5,
    color: '#64748b',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  metaValueHighlight: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  twoColumn: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f1f5f9',
  },
  cardRowLabel: {
    fontSize: 8.5,
    color: '#64748b',
  },
  cardRowValue: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  statusUnpaid: {
    color: '#dc2626',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 8,
    fontWeight: 'bold',
  },
  statusPaid: {
    color: '#16a34a',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 8,
    fontWeight: 'bold',
  },
  table: {
    marginTop: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0a192f',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tableHeaderCell: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tableCell: {
    fontSize: 9,
    color: '#334155',
  },
  tableCellBold: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  totalRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1.5,
    borderTopColor: '#0a192f',
  },
  totalCellLabel: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  totalCellValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  instructionsBox: {
    backgroundColor: '#fffbebf1',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 6,
  },
  instructionsText: {
    fontSize: 8,
    color: '#b45309',
    lineHeight: 1.5,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
  },
  signBox: {
    alignItems: 'center',
    width: 140,
  },
  signLine: {
    width: 130,
    borderBottomWidth: 1,
    borderBottomColor: '#64748b',
    marginBottom: 4,
  },
  signText: {
    fontSize: 8,
    color: '#64748b',
    textAlign: 'center',
  },
  footerEmblem: {
    width: 36,
    height: 36,
    objectFit: 'contain',
  },
})

export type FeeVoucherPdfProps = {
  voucherNo: string
  issueDate: string
  dueDate: string
  cycleMonth: string
  student: {
    studentId: string
    name: string
    fatherName: string
    phone: string
  }
  course: {
    name: string
    timing: string
    room: string
  }
  financials: {
    baseAmount: number
    discountAmount: number
    rolloverAmount: number
    finalAmount: number
    paidAmount: number
    remainingAmount: number
  }
  institution?: {
    name?: string
    address?: string
    phone?: string
  }
}

export function FeeVoucherPdf({
  voucherNo, issueDate, dueDate, cycleMonth,
  student, course, financials
}: FeeVoucherPdfProps) {
  const formatPkr = (num: number) => `PKR ${num.toLocaleString('en-PK')}`

  const instAddress = '27-28, Shoe Market, Al Burhan Arcade, Nishtar Rd, near Bagh-e-Halar Hall, Garden West, Karachi.'
  const instPhone = '0329 9955575'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Top Header Banner */}
        <View style={styles.headerContainer}>
          <View style={styles.headerLeft}>
            {logoBase64 && <Image src={logoBase64} style={styles.logoImage} />}
            <View>
              <Text style={styles.institutionTitle}>SHAMS COMMERCIAL INSTITUTE</Text>
              <Text style={styles.institutionSubtitle}>{instAddress}{'\n'}Ph: {instPhone}</Text>
            </View>
          </View>
          <View style={styles.voucherBadge}>
            <Text style={styles.voucherBadgeText}>FEE VOUCHER</Text>
          </View>
        </View>

        {/* Voucher Meta Grid */}
        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Voucher No.</Text>
            <Text style={styles.metaValue}>{voucherNo}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Billing Month</Text>
            <Text style={styles.metaValue}>{cycleMonth}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Issue Date</Text>
            <Text style={styles.metaValue}>{issueDate}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Due Date</Text>
            <Text style={styles.metaValueHighlight}>{dueDate}</Text>
          </View>
        </View>

        {/* Student & Course Details Row */}
        <View style={styles.twoColumn}>
          {/* Student Details Card */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Student Details</Text>
            <View style={styles.cardRow}>
              <Text style={styles.cardRowLabel}>Student Name:</Text>
              <Text style={styles.cardRowValue}>{student.name}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardRowLabel}>Student ID:</Text>
              <Text style={styles.cardRowValue}>{student.studentId}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardRowLabel}>Father Name:</Text>
              <Text style={styles.cardRowValue}>{student.fatherName}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardRowLabel}>Contact Phone:</Text>
              <Text style={styles.cardRowValue}>{student.phone || 'N/A'}</Text>
            </View>
          </View>

          {/* Course & Slot Card */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Course & Slot</Text>
            <View style={styles.cardRow}>
              <Text style={styles.cardRowLabel}>Course Enrolled:</Text>
              <Text style={styles.cardRowValue}>{course.name}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardRowLabel}>Class Timing:</Text>
              <Text style={styles.cardRowValue}>{course.timing}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardRowLabel}>Room / Lab:</Text>
              <Text style={styles.cardRowValue}>{course.room}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardRowLabel}>Voucher Status:</Text>
              <Text style={financials.remainingAmount <= 0 ? styles.statusPaid : styles.statusUnpaid}>
                {financials.remainingAmount <= 0 ? 'PAID' : 'UNPAID'}
              </Text>
            </View>
          </View>
        </View>

        {/* Fee Breakdown Table */}
        <Text style={styles.sectionTitle}>Fee Breakdown</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Description</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Amount</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 3 }]}>Course Monthly Tuition Fee ({cycleMonth})</Text>
            <Text style={[styles.tableCellBold, { flex: 1, textAlign: 'right' }]}>{formatPkr(financials.baseAmount)}</Text>
          </View>

          {financials.discountAmount > 0 && (
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 3, color: '#16a34a' }]}>Scholarship / Discount Applied</Text>
              <Text style={[styles.tableCellBold, { flex: 1, textAlign: 'right', color: '#16a34a' }]}>- {formatPkr(financials.discountAmount)}</Text>
            </View>
          )}

          {financials.rolloverAmount > 0 && (
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 3, color: '#dc2626' }]}>Previous Arrears / Rollover Balance</Text>
              <Text style={[styles.tableCellBold, { flex: 1, textAlign: 'right', color: '#dc2626' }]}>+ {formatPkr(financials.rolloverAmount)}</Text>
            </View>
          )}

          <View style={styles.tableRow}>
            <Text style={[styles.tableCellBold, { flex: 3 }]}>Total Net Billed Amount</Text>
            <Text style={[styles.tableCellBold, { flex: 1, textAlign: 'right' }]}>{formatPkr(financials.finalAmount)}</Text>
          </View>

          {financials.paidAmount > 0 && (
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 3, color: '#16a34a' }]}>Less Amount Paid</Text>
              <Text style={[styles.tableCellBold, { flex: 1, textAlign: 'right', color: '#16a34a' }]}>- {formatPkr(financials.paidAmount)}</Text>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={[styles.totalCellLabel, { flex: 3 }]}>NET BALANCE DUE (Payable on or before {dueDate}):</Text>
            <Text style={[styles.totalCellValue, { flex: 1, textAlign: 'right' }]}>{formatPkr(financials.remainingAmount)}</Text>
          </View>
        </View>

        {/* Important Payment Instructions */}
        <View style={styles.instructionsBox}>
          <Text style={styles.instructionsTitle}>IMPORTANT PAYMENT INSTRUCTIONS:</Text>
          <Text style={styles.instructionsText}>
            1. Fees can be paid in cash at the Shams Institute reception counter between 9:00 AM till 10:00 PM.{'\n'}
            2. Late payments submitted after the due date ({dueDate}) may incur a late surcharge.{'\n'}
            3. Keep this voucher or the digital/WhatsApp receipt as proof of payment.
          </Text>
        </View>

        {/* Signatures & Footer Emblem */}
        <View style={styles.footerContainer}>
          <View style={styles.signBox}>
            <View style={styles.signLine} />
            <Text style={styles.signText}>Student / Depositor Signature</Text>
          </View>

          {logoBase64 && <Image src={logoBase64} style={styles.footerEmblem} />}

          <View style={styles.signBox}>
            <View style={styles.signLine} />
            <Text style={styles.signText}>Authorized Stamp & Signature</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
