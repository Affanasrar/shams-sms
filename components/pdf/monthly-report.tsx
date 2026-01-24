// components/pdf/monthly-report.tsx
import React from 'react'
import { Text, View, StyleSheet } from '@react-pdf/renderer'
import { BaseTemplate } from './base-template'

type ReportFormat = {
  id: string
  reportType: string
  name: string
  showLogo: boolean
  logoPosition: string
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

interface MonthlyReportData {
  month: number
  year: number
  totalCollected: number
  totalPending: number
  totalStudents: number
  fees: Array<{
    id: string
    studentId: string
    studentName: string
    fatherName: string
    courseName: string
    amount: number
    status: string
    dueDate: Date
    paidDate?: Date
  }>
}

interface MonthlyReportProps {
  data: MonthlyReportData
  generatedAt: Date
  format: ReportFormat
}

export function MonthlyReport({ data, generatedAt, format }: MonthlyReportProps) {
  const monthName = new Date(data.year, data.month - 1).toLocaleDateString('en-US', { month: 'long' })

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
  })

  return (
    <BaseTemplate
      title={`Monthly Fees Report - ${monthName} ${data.year}`}
      subtitle={format.monthlyShowStudentDetails ? `Comprehensive overview of all fee collections and pending payments` : undefined}
      generatedAt={generatedAt}
      format={format}
    >
      {/* Summary Section */}
      <View style={dynamicStyles.summary}>
        <Text style={dynamicStyles.summaryTitle}>Monthly Summary</Text>
        <View style={dynamicStyles.summaryRow}>
          <Text style={dynamicStyles.summaryLabel}>Total Students:</Text>
          <Text style={dynamicStyles.summaryValue}>{data.totalStudents}</Text>
        </View>
        <View style={dynamicStyles.summaryRow}>
          <Text style={dynamicStyles.summaryLabel}>Total Collected:</Text>
          <Text style={dynamicStyles.summaryValue}>${data.totalCollected.toFixed(2)}</Text>
        </View>
        <View style={dynamicStyles.summaryRow}>
          <Text style={dynamicStyles.summaryLabel}>Total Pending:</Text>
          <Text style={dynamicStyles.summaryValue}>${data.totalPending.toFixed(2)}</Text>
        </View>
      </View>

      {/* Student Details Table */}
      {format.monthlyShowStudentDetails && (
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Student Fee Details</Text>
          <View style={dynamicStyles.table}>
            <View style={dynamicStyles.tableHeader}>
              <Text style={[dynamicStyles.tableHeaderText, { flex: 1 }]}>Student ID</Text>
              <Text style={[dynamicStyles.tableHeaderText, { flex: 2 }]}>Student Name</Text>
              <Text style={[dynamicStyles.tableHeaderText, { flex: 2 }]}>Course</Text>
              <Text style={[dynamicStyles.tableHeaderText, { flex: 1 }]}>Amount</Text>
              <Text style={[dynamicStyles.tableHeaderText, { flex: 1 }]}>Status</Text>
              {format.monthlyShowPaymentHistory && (
                <Text style={[dynamicStyles.tableHeaderText, { flex: 1 }]}>Paid Date</Text>
              )}
            </View>
            {data.fees.map((fee, index) => (
              <View key={fee.id} style={index % 2 === 0 ? dynamicStyles.tableRow : dynamicStyles.tableRowAlt}>
                <Text style={[dynamicStyles.tableCell, { flex: 1 }]}>{fee.studentId}</Text>
                <Text style={[dynamicStyles.tableCell, { flex: 2 }]}>{fee.studentName}</Text>
                <Text style={[dynamicStyles.tableCell, { flex: 2 }]}>{fee.courseName}</Text>
                <Text style={[dynamicStyles.tableCell, { flex: 1 }]}>${fee.amount.toFixed(2)}</Text>
                <Text style={[dynamicStyles.tableCell, { flex: 1 }]}>{fee.status}</Text>
                {format.monthlyShowPaymentHistory && (
                  <Text style={[dynamicStyles.tableCell, { flex: 1 }]}>
                    {fee.paidDate ? new Date(fee.paidDate).toLocaleDateString() : '-'}
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