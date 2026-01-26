// components/pdf/course-report.tsx
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

interface CourseReportData {
  course: {
    id: string
    name: string
    durationMonths: number
    baseFee: number
    feeType: string
  }
  totalStudents: number
  totalCollected: number
  totalPending: number
  students: Array<{
    id: string
    studentId: string
    name: string
    fatherName: string
    totalPaid: number
    totalPending: number
    lastPayment?: Date
  }>
}

interface CourseReportProps {
  data: CourseReportData
  generatedAt: Date
  format: ReportFormat
}

export function CourseReport({ data, generatedAt, format }: CourseReportProps) {
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
      title={`Course Fee Report - ${data.course.name}`}
      subtitle={`Fee collection summary for all enrolled students`}
      generatedAt={generatedAt}
      format={format}
    >
      {/* Course Information */}
      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.sectionTitle}>Course Information</Text>
        <View style={dynamicStyles.infoGrid}>
          <View style={dynamicStyles.infoColumn}>
            <Text style={dynamicStyles.infoLabel}>Course Name:</Text>
            <Text style={dynamicStyles.infoValue}>{data.course.name}</Text>

            <Text style={dynamicStyles.infoLabel}>Duration:</Text>
            <Text style={dynamicStyles.infoValue}>{data.course.durationMonths} months</Text>
          </View>
          <View style={dynamicStyles.infoColumn}>
            <Text style={dynamicStyles.infoLabel}>Base Fee:</Text>
            <Text style={dynamicStyles.infoValue}>PKR {data.course.baseFee.toFixed(2)}</Text>

            <Text style={dynamicStyles.infoLabel}>Fee Type:</Text>
            <Text style={dynamicStyles.infoValue}>{data.course.feeType}</Text>
          </View>
        </View>
      </View>

      {/* Course Summary */}
      <View style={dynamicStyles.summary}>
        <Text style={dynamicStyles.summaryTitle}>Course Summary</Text>
        <View style={dynamicStyles.summaryRow}>
          <Text style={dynamicStyles.summaryLabel}>Total Students:</Text>
          <Text style={dynamicStyles.summaryValue}>{data.totalStudents}</Text>
        </View>
        <View style={dynamicStyles.summaryRow}>
          <Text style={dynamicStyles.summaryLabel}>Total Collected:</Text>
          <Text style={dynamicStyles.summaryValue}>PKR {data.totalCollected.toFixed(2)}</Text>
        </View>
        <View style={dynamicStyles.summaryRow}>
          <Text style={dynamicStyles.summaryLabel}>Total Pending:</Text>
          <Text style={dynamicStyles.summaryValue}>PKR {data.totalPending.toFixed(2)}</Text>
        </View>
      </View>

      {/* Student List */}
      {format.courseShowStudentList && (
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Student Fee Details</Text>
          <View style={dynamicStyles.table}>
            <View style={dynamicStyles.tableHeader}>
              <Text style={[dynamicStyles.tableHeaderText, { flex: 1 }]}>Student ID</Text>
              <Text style={[dynamicStyles.tableHeaderText, { flex: 2 }]}>Student Name</Text>
              <Text style={[dynamicStyles.tableHeaderText, { flex: 1 }]}>Total Paid</Text>
              <Text style={[dynamicStyles.tableHeaderText, { flex: 1 }]}>Total Pending</Text>
              <Text style={[dynamicStyles.tableHeaderText, { flex: 1 }]}>Last Payment</Text>
            </View>
            {data.students.map((student, index) => (
              <View key={student.id} style={index % 2 === 0 ? dynamicStyles.tableRow : dynamicStyles.tableRowAlt}>
                <Text style={[dynamicStyles.tableCell, { flex: 1 }]}>{student.studentId}</Text>
                <Text style={[dynamicStyles.tableCell, { flex: 2 }]}>{student.name}</Text>
                <Text style={[dynamicStyles.tableCell, { flex: 1 }]}>PKR {student.totalPaid.toFixed(2)}</Text>
                <Text style={[dynamicStyles.tableCell, { flex: 1 }]}>PKR {student.totalPending.toFixed(2)}</Text>
                <Text style={[dynamicStyles.tableCell, { flex: 1 }]}>
                  {student.lastPayment ? new Date(student.lastPayment).toLocaleDateString('en-US', { timeZone: 'Asia/Karachi' }) : '-'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </BaseTemplate>
  )
}