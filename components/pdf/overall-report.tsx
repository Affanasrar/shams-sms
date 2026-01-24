// components/pdf/overall-report.tsx
import React from 'react'
import { Text, View } from '@react-pdf/renderer'
import { BaseTemplate, styles } from './base-template'

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
}

export function OverallReport({ data, generatedAt }: OverallReportProps) {
  return (
    <BaseTemplate
      title="Overall Institution Fee Report"
      subtitle="Comprehensive overview of all fees, courses, and collections"
      generatedAt={generatedAt}
    >
      {/* Institution Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Institution Overview</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Students:</Text>
          <Text style={styles.summaryValue}>{data.totalStudents}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Courses:</Text>
          <Text style={styles.summaryValue}>{data.totalCourses}</Text>
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
          <Text style={styles.summaryLabel}>Overall Collection Rate:</Text>
          <Text style={styles.summaryValue}>
            {((data.totalCollected / (data.totalCollected + data.totalPending)) * 100).toFixed(1)}%
          </Text>
        </View>
      </View>

      {/* Course-wise Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Course-wise Collection Summary</Text>

        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 2 }]}>Course Name</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Students</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Collected</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Pending</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Collection Rate</Text>
        </View>

        {/* Table Rows */}
        {data.courses.map((course, index) => (
          <View key={course.id} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tableCell, { flex: 2 }]}>{course.name}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{course.studentCount}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>${course.collected.toFixed(2)}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>${course.pending.toFixed(2)}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>
              {course.studentCount > 0 ? ((course.collected / (course.collected + course.pending)) * 100).toFixed(1) : 0}%
            </Text>
          </View>
        ))}
      </View>

      {/* Monthly Trends */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monthly Collection Trends</Text>

        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Month/Year</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Collected</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Pending</Text>
          <Text style={[styles.tableHeaderText, { flex: 1 }]}>Collection Rate</Text>
        </View>

        {/* Table Rows */}
        {data.monthlyData.map((month, index) => (
          <View key={`${month.month}-${month.year}`} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={[styles.tableCell, { flex: 1 }]}>
              {new Date(month.year, month.month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>${month.collected.toFixed(2)}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>${month.pending.toFixed(2)}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>
              {((month.collected / (month.collected + month.pending)) * 100).toFixed(1)}%
            </Text>
          </View>
        ))}
      </View>
    </BaseTemplate>
  )
}