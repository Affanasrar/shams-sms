// components/pdf/student-report.tsx
import React from 'react'
import { Text, View, StyleSheet } from '@react-pdf/renderer'
import { BaseTemplate } from './base-template'

type ReportFormat = {
  id: string
  reportType: string
  name: string
  showLogo: boolean
  logoPosition: string
  logoUrl?: string | null
  headerText?: string | null
  footerText?: string | null
  titleFontSize: number
  titleFontFamily: string
  subtitleFontSize: number
  subtitleFontFamily: string
  bodyFontSize: number
  bodyFontFamily: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  pageOrientation: string
  pageSize: string
  marginTop: number
  marginBottom: number
  marginLeft: number
  marginRight: number
  showGeneratedDate: boolean
  showPageNumbers: boolean
  showInstitutionInfo: boolean
  institutionName: string
  institutionAddress?: string | null
  institutionPhone?: string | null
  institutionEmail?: string | null
  monthlyShowStudentDetails: boolean
  monthlyShowPaymentHistory: boolean
  studentShowFeeBreakdown: boolean
  studentShowPaymentTimeline: boolean
  courseShowStudentList: boolean
  overallShowCharts: boolean
  overallShowMonthlyTrends: boolean
}

interface StudentReportData {
  student: {
    id: string
    studentId: string
    name: string
    fatherName: string
    phone: string
    admission: Date
  }
  totalPaid: number
  totalPending: number
  totalFees: number
  fees: Array<{
    id: string
    courseName: string
    amount: number
    status: string
    dueDate: Date
    paidDate?: Date
    month: number
    year: number
  }>
}

interface StudentReportProps {
  data: StudentReportData
  generatedAt: Date
  format: ReportFormat
}

export function StudentReport({ data, generatedAt, format }: StudentReportProps) {
  // Create dynamic styles based on format
  const dynamicStyles = StyleSheet.create({
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: format.subtitleFontSize,
      fontFamily: format.subtitleFontFamily,
      color: format.primaryColor,
      marginBottom: 10,
      fontWeight: 'bold',
      backgroundColor: format.secondaryColor + '20',
      padding: 8,
      borderRadius: 4,
    },
    infoGrid: {
      flexDirection: 'row',
      marginBottom: 10,
    },
    infoColumn: {
      flex: 1,
    },
    infoLabel: {
      fontSize: format.bodyFontSize - 1,
      color: format.secondaryColor,
      marginBottom: 2,
    },
    infoValue: {
      fontSize: format.bodyFontSize,
      fontFamily: format.bodyFontFamily,
      fontWeight: 'bold',
      color: format.primaryColor,
      marginBottom: 5,
    },
    summary: {
      marginTop: 20,
      padding: 15,
      backgroundColor: format.secondaryColor + '20',
      borderRadius: 4,
    },
    summaryTitle: {
      fontSize: format.subtitleFontSize,
      fontFamily: format.subtitleFontFamily,
      fontWeight: 'bold',
      color: format.primaryColor,
      marginBottom: 8,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    summaryLabel: {
      fontSize: format.bodyFontSize - 1,
      fontFamily: format.bodyFontFamily,
      color: format.secondaryColor,
    },
    summaryValue: {
      fontSize: format.bodyFontSize,
      fontFamily: format.bodyFontFamily,
      fontWeight: 'bold',
      color: format.primaryColor,
    },
    table: {
      marginBottom: 15,
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: format.accentColor,
      padding: 8,
      marginBottom: 2,
    },
    tableHeaderText: {
      color: 'white',
      fontSize: format.bodyFontSize - 1,
      fontFamily: format.bodyFontFamily,
      fontWeight: 'bold',
    },
    tableRow: {
      flexDirection: 'row',
      padding: 6,
      backgroundColor: format.backgroundColor === '#ffffff' ? '#f9fafb' : format.secondaryColor + '10',
      marginBottom: 1,
    },
    tableRowAlt: {
      flexDirection: 'row',
      padding: 6,
      backgroundColor: format.backgroundColor,
      marginBottom: 1,
    },
    tableCell: {
      fontSize: format.bodyFontSize - 2,
      fontFamily: format.bodyFontFamily,
      color: format.primaryColor,
    },
  })

  return (
    <BaseTemplate
      title={`Student Fee Report - ${data.student.name}`}
      subtitle={`Complete fee history and payment details for ${data.student.studentId}`}
      generatedAt={generatedAt}
      format={format}
    >
      {/* Student Information */}
      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.sectionTitle}>Student Information</Text>
        <View style={dynamicStyles.infoGrid}>
          <View style={dynamicStyles.infoColumn}>
            <Text style={dynamicStyles.infoLabel}>Student ID:</Text>
            <Text style={dynamicStyles.infoValue}>{data.student.studentId}</Text>

            <Text style={dynamicStyles.infoLabel}>Name:</Text>
            <Text style={dynamicStyles.infoValue}>{data.student.name}</Text>

            <Text style={dynamicStyles.infoLabel}>Father's Name:</Text>
            <Text style={dynamicStyles.infoValue}>{data.student.fatherName}</Text>
          </View>
          <View style={dynamicStyles.infoColumn}>
            <Text style={dynamicStyles.infoLabel}>Phone:</Text>
            <Text style={dynamicStyles.infoValue}>{data.student.phone}</Text>

            <Text style={dynamicStyles.infoLabel}>Admission Date:</Text>
            <Text style={dynamicStyles.infoValue}>{new Date(data.student.admission).toLocaleDateString('en-US', { timeZone: 'Asia/Karachi' })}</Text>
          </View>
        </View>
      </View>

      {/* Fee Summary */}
      <View style={dynamicStyles.summary}>
        <Text style={dynamicStyles.summaryTitle}>Fee Summary</Text>
        <View style={dynamicStyles.summaryRow}>
          <Text style={dynamicStyles.summaryLabel}>Total Fees:</Text>
          <Text style={dynamicStyles.summaryValue}>PKR {data.totalFees.toFixed(2)}</Text>
        </View>
        <View style={dynamicStyles.summaryRow}>
          <Text style={dynamicStyles.summaryLabel}>Total Paid:</Text>
          <Text style={dynamicStyles.summaryValue}>PKR {data.totalPaid.toFixed(2)}</Text>
        </View>
        <View style={dynamicStyles.summaryRow}>
          <Text style={dynamicStyles.summaryLabel}>Total Pending:</Text>
          <Text style={dynamicStyles.summaryValue}>PKR {data.totalPending.toFixed(2)}</Text>
        </View>
      </View>

      {/* Fee Breakdown */}
      {format.studentShowFeeBreakdown && (
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Fee Breakdown</Text>
          <View style={dynamicStyles.table}>
            <View style={dynamicStyles.tableHeader}>
              <Text style={[dynamicStyles.tableHeaderText, { flex: 1 }]}>Month/Year</Text>
              <Text style={[dynamicStyles.tableHeaderText, { flex: 2 }]}>Course</Text>
              <Text style={[dynamicStyles.tableHeaderText, { flex: 1 }]}>Amount</Text>
              <Text style={[dynamicStyles.tableHeaderText, { flex: 1 }]}>Status</Text>
              {format.studentShowPaymentTimeline && (
                <Text style={[dynamicStyles.tableHeaderText, { flex: 1 }]}>Paid Date</Text>
              )}
            </View>
            {data.fees.map((fee, index) => (
              <View key={fee.id} style={index % 2 === 0 ? dynamicStyles.tableRow : dynamicStyles.tableRowAlt}>
                <Text style={[dynamicStyles.tableCell, { flex: 1 }]}>
                  {new Date(fee.year, fee.month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'Asia/Karachi' })}
                </Text>
                <Text style={[dynamicStyles.tableCell, { flex: 2 }]}>{fee.courseName}</Text>
                <Text style={[dynamicStyles.tableCell, { flex: 1 }]}>PKR {fee.amount.toFixed(2)}</Text>
                <Text style={[dynamicStyles.tableCell, { flex: 1 }]}>{fee.status}</Text>
                {format.studentShowPaymentTimeline && (
                  <Text style={[dynamicStyles.tableCell, { flex: 1 }]}>
                    {fee.paidDate ? new Date(fee.paidDate).toLocaleDateString('en-US', { timeZone: 'Asia/Karachi' }) : '-'}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>
      )}
    </BaseTemplate>
  )
}