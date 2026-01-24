// components/pdf/course-report.tsx
import React from 'react'
import { Text, View } from '@react-pdf/renderer'
import { BaseTemplate, styles } from './base-template'

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
}

export function CourseReport({ data, generatedAt }: CourseReportProps) {
  return (
    <BaseTemplate
      title={`Course Fee Report - ${data.course.name}`}
      subtitle={`Fee collection summary for all enrolled students`}
      generatedAt={generatedAt}
    >
      {/* Course Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Course Information</Text>
        <View style={{ flexDirection: 'row', marginBottom: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 9, color: '#6b7280', marginBottom: 2 }}>Course Name:</Text>
            <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 5 }}>{data.course.name}</Text>

            <Text style={{ fontSize: 9, color: '#6b7280', marginBottom: 2 }}>Duration:</Text>
            <Text style={{ fontSize: 10, fontWeight: 'bold' }}>{data.course.durationMonths} months</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 9, color: '#6b7280', marginBottom: 2 }}>Base Fee:</Text>
            <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 5 }}>${data.course.baseFee.toFixed(2)}</Text>

            <Text style={{ fontSize: 9, color: '#6b7280', marginBottom: 2 }}>Fee Type:</Text>
            <Text style={{ fontSize: 10, fontWeight: 'bold' }}>{data.course.feeType}</Text>
          </View>
        </View>
      </View>

      {/* Summary Section */}
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Collection Summary</Text>
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
          <Text style={styles.summaryLabel}>Average per Student:</Text>
          <Text style={styles.summaryValue}>
            ${data.totalStudents > 0 ? (data.totalCollected / data.totalStudents).toFixed(2) : '0.00'}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Collection Rate:</Text>
          <Text style={styles.summaryValue}>
            {data.totalStudents > 0 ? ((data.totalCollected / (data.totalCollected + data.totalPending)) * 100).toFixed(1) : 0}%
          </Text>
        </View>
      </View>

      {/* Students Table */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Student Fee Details</Text>

        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Student ID</Text>
          <Text style={[styles.tableHeaderText, { flex: 2 }]}>Student Name</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Paid</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Pending</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Status</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Last Payment</Text>
        </View>

        {/* Table Rows */}
        {data.students.map((student, index) => (
          <View key={student.id} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tableCell, { flex: 1 }]}>{student.studentId}</Text>
            <Text style={[styles.tableCell, { flex: 2 }]}>
              {student.name}
              {'\n'}
              <Text style={{ fontSize: 7, color: '#6b7280' }}>{student.fatherName}</Text>
            </Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>${student.totalPaid.toFixed(2)}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>${student.totalPending.toFixed(2)}</Text>
            <Text style={[styles.tableCell, { flex: 1, color: student.totalPending === 0 ? '#059669' : student.totalPaid > 0 ? '#d97706' : '#dc2626' }]}>
              {student.totalPending === 0 ? 'Paid' : student.totalPaid > 0 ? 'Partial' : 'Unpaid'}
            </Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>
              {student.lastPayment ? new Date(student.lastPayment).toLocaleDateString() : '-'}
            </Text>
          </View>
        ))}
      </View>
    </BaseTemplate>
  )
}