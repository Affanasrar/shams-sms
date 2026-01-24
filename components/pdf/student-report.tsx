// components/pdf/student-report.tsx
import React from 'react'
import { Text, View } from '@react-pdf/renderer'
import { BaseTemplate, styles } from './base-template'

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
}

export function StudentReport({ data, generatedAt }: StudentReportProps) {
  return (
    <BaseTemplate
      title={`Student Fee Report - ${data.student.name}`}
      subtitle={`Complete fee history and payment details for ${data.student.studentId}`}
      generatedAt={generatedAt}
    >
      {/* Student Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Student Information</Text>
        <View style={{ flexDirection: 'row', marginBottom: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 9, color: '#6b7280', marginBottom: 2 }}>Student ID:</Text>
            <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 5 }}>{data.student.studentId}</Text>

            <Text style={{ fontSize: 9, color: '#6b7280', marginBottom: 2 }}>Name:</Text>
            <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 5 }}>{data.student.name}</Text>

            <Text style={{ fontSize: 9, color: '#6b7280', marginBottom: 2 }}>Father's Name:</Text>
            <Text style={{ fontSize: 10, fontWeight: 'bold' }}>{data.student.fatherName}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 9, color: '#6b7280', marginBottom: 2 }}>Phone:</Text>
            <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 5 }}>{data.student.phone}</Text>

            <Text style={{ fontSize: 9, color: '#6b7280', marginBottom: 2 }}>Admission Date:</Text>
            <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 5 }}>
              {new Date(data.student.admission).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Summary Section */}
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Fee Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Fees:</Text>
          <Text style={styles.summaryValue}>${data.totalFees.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Paid:</Text>
          <Text style={styles.summaryValue}>${data.totalPaid.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Pending:</Text>
          <Text style={styles.summaryValue}>${data.totalPending.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Payment Status:</Text>
          <Text style={[styles.summaryValue, {
            color: data.totalPending === 0 ? '#059669' : data.totalPaid > 0 ? '#d97706' : '#dc2626'
          }]}>
            {data.totalPending === 0 ? 'All Paid' : data.totalPaid > 0 ? 'Partial' : 'Unpaid'}
          </Text>
        </View>
      </View>

      {/* Fee History Table */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fee Payment History</Text>

        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Month/Year</Text>
          <Text style={[styles.tableHeaderText, { flex: 2 }]}>Course</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Amount</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Status</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Due Date</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Paid Date</Text>
        </View>

        {/* Table Rows */}
        {data.fees.map((fee, index) => (
          <View key={fee.id} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tableCell, { flex: 1 }]}>
              {new Date(fee.year, fee.month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
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