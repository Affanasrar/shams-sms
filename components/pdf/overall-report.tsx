// components/pdf/overall-report.tsx
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

interface OverallReportData {
  totalStudents: number
  totalCourses: number
  totalCollected: number
  totalPending: number
  courses: Array<{
    id: string
    name: string
    studentCount: number
    collected: number
    pending: number
  }>
  monthlyData: Array<{
    month: number
    year: number
    collected: number
    pending: number
  }>
}

interface OverallReportProps {
  data: OverallReportData
  generatedAt: Date
  format: ReportFormat
}

export function OverallReport({ data, generatedAt, format }: OverallReportProps) {
  const dynamicStyles = StyleSheet.create({
    summary: {
      backgroundColor: format.backgroundColor,
      border: `1pt solid ${format.secondaryColor}`,
      borderRadius: 4,
      padding: 15,
      marginBottom: 20,
    },
    summaryTitle: {
      fontSize: format.titleFontSize - 4,
      fontFamily: format.titleFontFamily,
      color: format.primaryColor,
      marginBottom: 15,
      textAlign: 'center',
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottom: `0.5pt solid ${format.secondaryColor}`,
    },
    summaryLabel: {
      fontSize: format.bodyFontSize,
      fontFamily: format.bodyFontFamily,
      color: format.secondaryColor,
      flex: 1,
    },
    summaryValue: {
      fontSize: format.bodyFontSize,
      fontFamily: format.titleFontFamily,
      color: format.primaryColor,
      flex: 1,
      textAlign: 'right',
    },
    section: {
      marginBottom: 25,
    },
    sectionTitle: {
      fontSize: format.subtitleFontSize,
      fontFamily: format.titleFontFamily,
      color: format.primaryColor,
      marginBottom: 15,
      borderBottom: `1pt solid ${format.accentColor}`,
      paddingBottom: 5,
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: format.primaryColor,
      padding: 8,
      marginBottom: 5,
    },
    tableHeaderText: {
      fontSize: format.bodyFontSize - 1,
      fontFamily: format.titleFontFamily,
      color: format.backgroundColor,
      textAlign: 'center',
    },
    tableRow: {
      flexDirection: 'row',
      backgroundColor: format.backgroundColor,
      padding: 8,
      borderBottom: `0.5pt solid ${format.secondaryColor}`,
    },
    tableRowAlt: {
      flexDirection: 'row',
      backgroundColor: `${format.secondaryColor}20`,
      padding: 8,
      borderBottom: `0.5pt solid ${format.secondaryColor}`,
    },
    tableCell: {
      fontSize: format.bodyFontSize - 1,
      fontFamily: format.bodyFontFamily,
      color: format.primaryColor,
      textAlign: 'center',
    },
  })

  return (
    <BaseTemplate
      title="Overall Institution Fee Report"
      subtitle="Comprehensive overview of all fees, courses, and collections"
      generatedAt={generatedAt}
      format={format}
    >
      {/* Institution Summary */}
      <View style={dynamicStyles.summary}>
        <Text style={dynamicStyles.summaryTitle}>Institution Overview</Text>
        <View style={dynamicStyles.summaryRow}>
          <Text style={dynamicStyles.summaryLabel}>Total Students:</Text>
          <Text style={dynamicStyles.summaryValue}>{data.totalStudents}</Text>
        </View>
        <View style={dynamicStyles.summaryRow}>
          <Text style={dynamicStyles.summaryLabel}>Total Courses:</Text>
          <Text style={dynamicStyles.summaryValue}>{data.totalCourses}</Text>
        </View>
        <View style={dynamicStyles.summaryRow}>
          <Text style={dynamicStyles.summaryLabel}>Total Collected:</Text>
          <Text style={dynamicStyles.summaryValue}>PKR {data.totalCollected.toFixed(2)}</Text>
        </View>
        <View style={dynamicStyles.summaryRow}>
          <Text style={dynamicStyles.summaryLabel}>Total Pending:</Text>
          <Text style={dynamicStyles.summaryValue}>PKR {data.totalPending.toFixed(2)}</Text>
        </View>
        <View style={dynamicStyles.summaryRow}>
          <Text style={dynamicStyles.summaryLabel}>Overall Collection Rate:</Text>
          <Text style={dynamicStyles.summaryValue}>
            {((data.totalCollected / (data.totalCollected + data.totalPending)) * 100).toFixed(1)}%
          </Text>
        </View>
      </View>

      {/* Course-wise Summary */}
      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.sectionTitle}>Course-wise Collection Summary</Text>

        {/* Table Header */}
        <View style={dynamicStyles.tableHeader}>
          <Text style={[dynamicStyles.tableHeaderText, { flex: 2 }]}>Course Name</Text>
          <Text style={[dynamicStyles.tableHeaderText, { flex: 1 }]}>Students</Text>
          <Text style={[dynamicStyles.tableHeaderText, { flex: 1 }]}>Collected</Text>
          <Text style={[dynamicStyles.tableHeaderText, { flex: 1 }]}>Pending</Text>
          <Text style={[dynamicStyles.tableHeaderText, { flex: 1 }]}>Collection Rate</Text>
        </View>

        {/* Table Rows */}
        {data.courses.map((course, index) => (
          <View key={course.id} style={index % 2 === 0 ? dynamicStyles.tableRow : dynamicStyles.tableRowAlt}>
            <Text style={[dynamicStyles.tableCell, { flex: 2 }]}>{course.name}</Text>
            <Text style={[dynamicStyles.tableCell, { flex: 1 }]}>{course.studentCount}</Text>
            <Text style={[dynamicStyles.tableCell, { flex: 1 }]}>PKR {course.collected.toFixed(2)}</Text>
            <Text style={[dynamicStyles.tableCell, { flex: 1 }]}>PKR {course.pending.toFixed(2)}</Text>
            <Text style={[dynamicStyles.tableCell, { flex: 1 }]}>
              {course.studentCount > 0 ? ((course.collected / (course.collected + course.pending)) * 100).toFixed(1) : 0}%
            </Text>
          </View>
        ))}
      </View>

      {/* Monthly Trends */}
      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.sectionTitle}>Monthly Collection Trends</Text>

        {/* Table Header */}
        <View style={dynamicStyles.tableHeader}>
          <Text style={[dynamicStyles.tableHeaderText, { flex: 1 }]}>Month/Year</Text>
          <Text style={[dynamicStyles.tableHeaderText, { flex: 1 }]}>Collected</Text>
          <Text style={[dynamicStyles.tableHeaderText, { flex: 1 }]}>Pending</Text>
          <Text style={[dynamicStyles.tableHeaderText, { flex: 1 }]}>Collection Rate</Text>
        </View>

        {/* Table Rows */}
        {data.monthlyData.map((month, index) => (
          <View key={`${month.month}-${month.year}`} style={index % 2 === 0 ? dynamicStyles.tableRow : dynamicStyles.tableRowAlt}>
            <Text style={[dynamicStyles.tableCell, { flex: 1 }]}>
              {new Date(month.year, month.month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'Asia/Karachi' })}
            </Text>
            <Text style={[dynamicStyles.tableCell, { flex: 1 }]}>PKR {month.collected.toFixed(2)}</Text>
            <Text style={[dynamicStyles.tableCell, { flex: 1 }]}>PKR {month.pending.toFixed(2)}</Text>
            <Text style={[dynamicStyles.tableCell, { flex: 1 }]}>
              {((month.collected / (month.collected + month.pending)) * 100).toFixed(1)}%
            </Text>
          </View>
        ))}
      </View>
    </BaseTemplate>
  )
}