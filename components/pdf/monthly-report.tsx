// components/pdf/monthly-report.tsx
import React from 'react'
import { Text, View } from '@react-pdf/renderer'
import { BaseTemplate, styles } from './base-template'

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
}

export function MonthlyReport({ data, generatedAt }: MonthlyReportProps) {
  const monthName = new Date(data.year, data.month - 1).toLocaleDateString('en-US', { month: 'long' })

  return (
    <BaseTemplate
      title={`Monthly Fees Report - ${monthName} ${data.year}`}
      subtitle={`Comprehensive overview of all fee collections and pending payments`}
      generatedAt={generatedAt}
    >
      {/* Summary Section */}
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Monthly Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Students:</Text>
          <Text style={styles.summaryValue}>{data.totalStudents}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Collected:</Text>
          <Text style={styles.summaryValue}>${data.totalCollected.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Pending:</Text>
          <Text style={styles.summaryValue}>${data.totalPending.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Collection Rate:</Text>
          <Text style={styles.summaryValue}>
            {data.totalStudents > 0 ? ((data.totalCollected / (data.totalCollected + data.totalPending)) * 100).toFixed(1) : 0}%
          </Text>
        </View>
      </View>

      {/* Fees Table */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fee Details</Text>

        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Student ID</Text>
          <Text style={[styles.tableHeaderText, { flex: 2 }]}>Student Name</Text>
          <Text style={[styles.tableHeaderText, { flex: 2 }]}>Course</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Amount</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Status</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Due Date</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Paid Date</Text>
        </View>

        {/* Table Rows */}
        {data.fees.map((fee, index) => (
          <View key={fee.id} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tableCell, { flex: 1 }]}>{fee.studentId}</Text>
            <Text style={[styles.tableCell, { flex: 2 }]}>
              {fee.studentName}
              {'\n'}
              <Text style={{ fontSize: 7, color: '#6b7280' }}>{fee.fatherName}</Text>
            </Text>
            <Text style={[styles.tableCell, { flex: 2 }]}>{fee.courseName}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>${fee.amount.toFixed(2)}</Text>
            <Text style={[styles.tableCell, { flex: 1, color: fee.status === 'PAID' ? '#059669' : '#dc2626' }]}>
              {fee.status}
            </Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>
              {new Date(fee.dueDate).toLocaleDateString()}
            </Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>
              {fee.paidDate ? new Date(fee.paidDate).toLocaleDateString() : '-'}
            </Text>
          </View>
        ))}
      </View>
    </BaseTemplate>
  )
}