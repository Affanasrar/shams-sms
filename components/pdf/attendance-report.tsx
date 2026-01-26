// components/pdf/attendance-report.tsx
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

interface AttendanceReportData {
  course: {
    id: string
    name: string
    durationMonths: number
    baseFee: number
    feeType: string
  }
  slot: {
    id: string
    days: string
    startTime: Date
    endTime: Date
    room: {
      name: string
    }
  }
  teacher: {
    firstName: string
    lastName: string
  } | null
  month: number
  year: number
  monthName: string
  students: Array<{
    id: string
    studentId: string
    name: string
    fatherName: string
    attendance: Record<string, 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE'>
    summary: {
      totalDays: number
      presentDays: number
      absentDays: number
      lateDays: number
      leaveDays: number
      attendancePercentage: number
    }
  }>
  totalStudents: number
  generatedAt: Date
}

interface AttendanceReportProps {
  data: AttendanceReportData
  generatedAt: Date
  format: ReportFormat
}

export function AttendanceReport({ data, generatedAt, format }: AttendanceReportProps) {
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
      fontWeight: 'bold',
    },
    infoValue: {
      fontSize: format.bodyFontSize,
      color: format.primaryColor,
      marginBottom: 5,
    },
    table: {
      marginTop: 10,
      marginBottom: 20,
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: format.secondaryColor,
      padding: 8,
      borderBottomWidth: 1,
      borderBottomColor: format.primaryColor,
    },
    tableHeaderText: {
      fontSize: format.bodyFontSize - 1,
      fontWeight: 'bold',
      color: 'white',
    },
    tableRow: {
      flexDirection: 'row',
      padding: 6,
      borderBottomWidth: 1,
      borderBottomColor: '#e5e7eb',
    },
    tableRowAlt: {
      backgroundColor: '#f9fafb',
    },
    tableCell: {
      fontSize: format.bodyFontSize - 1,
      color: format.primaryColor,
    },
    statusPresent: {
      backgroundColor: '#dcfce7',
      color: '#166534',
      padding: 2,
      borderRadius: 2,
      textAlign: 'center',
      fontSize: format.bodyFontSize - 2,
    },
    statusAbsent: {
      backgroundColor: '#fef2f2',
      color: '#dc2626',
      padding: 2,
      borderRadius: 2,
      textAlign: 'center',
      fontSize: format.bodyFontSize - 2,
    },
    statusLate: {
      backgroundColor: '#fef3c7',
      color: '#d97706',
      padding: 2,
      borderRadius: 2,
      textAlign: 'center',
      fontSize: format.bodyFontSize - 2,
    },
    statusLeave: {
      backgroundColor: '#dbeafe',
      color: '#2563eb',
      padding: 2,
      borderRadius: 2,
      textAlign: 'center',
      fontSize: format.bodyFontSize - 2,
    },
    summaryBox: {
      backgroundColor: format.accentColor + '10',
      padding: 10,
      borderRadius: 4,
      marginBottom: 10,
    },
    summaryText: {
      fontSize: format.bodyFontSize,
      color: format.primaryColor,
      marginBottom: 5,
    },
  })

  // Get all dates in the month that have attendance records
  const allDates = new Set<string>()
  data.students.forEach(student => {
    Object.keys(student.attendance).forEach(date => allDates.add(date))
  })
  const sortedDates = Array.from(allDates).sort()

  const getStatusStyle = (status?: string) => {
    const baseStyle = {
      padding: 2,
      borderRadius: 2,
      textAlign: 'center' as const,
      fontSize: format.bodyFontSize - 2,
    }

    switch (status) {
      case 'PRESENT': return { ...baseStyle, backgroundColor: '#dcfce7', color: '#166534' }
      case 'ABSENT': return { ...baseStyle, backgroundColor: '#fef2f2', color: '#dc2626' }
      case 'LATE': return { ...baseStyle, backgroundColor: '#fef3c7', color: '#d97706' }
      case 'LEAVE': return { ...baseStyle, backgroundColor: '#dbeafe', color: '#2563eb' }
      default: return { ...baseStyle, color: '#6b7280' }
    }
  }

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'PRESENT': return 'P'
      case 'ABSENT': return 'A'
      case 'LATE': return 'L'
      case 'LEAVE': return 'LV'
      default: return '-'
    }
  }

  return (
    <BaseTemplate format={format} title={`Attendance Report - ${data.course.name}`} generatedAt={generatedAt}>
      {/* Course Information */}
      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.sectionTitle}>Course Information</Text>
        <View style={dynamicStyles.infoGrid}>
          <View style={dynamicStyles.infoColumn}>
            <Text style={dynamicStyles.infoLabel}>Course:</Text>
            <Text style={dynamicStyles.infoValue}>{data.course.name}</Text>
            <Text style={dynamicStyles.infoLabel}>Duration:</Text>
            <Text style={dynamicStyles.infoValue}>{data.course.durationMonths} months</Text>
          </View>
          <View style={dynamicStyles.infoColumn}>
            <Text style={dynamicStyles.infoLabel}>Schedule:</Text>
            <Text style={dynamicStyles.infoValue}>
              {data.slot.days} • {new Date(data.slot.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - {new Date(data.slot.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
            </Text>
            <Text style={dynamicStyles.infoLabel}>Room:</Text>
            <Text style={dynamicStyles.infoValue}>{data.slot.room.name}</Text>
          </View>
          <View style={dynamicStyles.infoColumn}>
            <Text style={dynamicStyles.infoLabel}>Teacher:</Text>
            <Text style={dynamicStyles.infoValue}>
              {data.teacher ? `${data.teacher.firstName} ${data.teacher.lastName}` : 'Not assigned'}
            </Text>
            <Text style={dynamicStyles.infoLabel}>Report Period:</Text>
            <Text style={dynamicStyles.infoValue}>{data.monthName} {data.year}</Text>
          </View>
        </View>
      </View>

      {/* Summary Statistics */}
      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.sectionTitle}>Summary Statistics</Text>
        <View style={dynamicStyles.summaryBox}>
          <Text style={dynamicStyles.summaryText}>Total Students: {data.totalStudents}</Text>
          <Text style={dynamicStyles.summaryText}>
            Average Attendance: {data.students.length > 0 ? Math.round(data.students.reduce((sum, s) => sum + s.summary.attendancePercentage, 0) / data.students.length) : 0}%
          </Text>
        </View>
      </View>

      {/* Attendance Table */}
      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.sectionTitle}>Monthly Attendance Record</Text>

        {/* Table Header */}
        <View style={dynamicStyles.tableHeader}>
          <View style={{ width: 60 }}>
            <Text style={dynamicStyles.tableHeaderText}>ID</Text>
          </View>
          <View style={{ width: 120 }}>
            <Text style={dynamicStyles.tableHeaderText}>Student Name</Text>
          </View>
          <View style={{ width: 100 }}>
            <Text style={dynamicStyles.tableHeaderText}>Father Name</Text>
          </View>
          {sortedDates.map(date => (
            <View key={date} style={{ width: 30, alignItems: 'center' }}>
              <Text style={dynamicStyles.tableHeaderText}>
                {new Date(date).getDate()}
              </Text>
            </View>
          ))}
          <View style={{ width: 50, alignItems: 'center' }}>
            <Text style={dynamicStyles.tableHeaderText}>Total</Text>
          </View>
          <View style={{ width: 50, alignItems: 'center' }}>
            <Text style={dynamicStyles.tableHeaderText}>%</Text>
          </View>
        </View>

        {/* Table Rows */}
        {data.students.map((student, index) => (
          <View key={student.id} style={[dynamicStyles.tableRow, index % 2 === 1 ? dynamicStyles.tableRowAlt : {}]}>
            <View style={{ width: 60 }}>
              <Text style={dynamicStyles.tableCell}>{student.studentId}</Text>
            </View>
            <View style={{ width: 120 }}>
              <Text style={dynamicStyles.tableCell}>{student.name}</Text>
            </View>
            <View style={{ width: 100 }}>
              <Text style={dynamicStyles.tableCell}>{student.fatherName}</Text>
            </View>
            {sortedDates.map(date => (
              <View key={date} style={{ width: 30, alignItems: 'center' }}>
                <Text style={getStatusStyle(student.attendance[date])}>
                  {getStatusText(student.attendance[date])}
                </Text>
              </View>
            ))}
            <View style={{ width: 50, alignItems: 'center' }}>
              <Text style={dynamicStyles.tableCell}>{student.summary.presentDays}</Text>
            </View>
            <View style={{ width: 50, alignItems: 'center' }}>
              <Text style={dynamicStyles.tableCell}>{student.summary.attendancePercentage}%</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Legend */}
      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.sectionTitle}>Legend</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Text style={dynamicStyles.statusPresent}>P</Text>
            <Text style={{ fontSize: format.bodyFontSize - 1 }}>Present</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Text style={dynamicStyles.statusAbsent}>A</Text>
            <Text style={{ fontSize: format.bodyFontSize - 1 }}>Absent</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Text style={dynamicStyles.statusLate}>L</Text>
            <Text style={{ fontSize: format.bodyFontSize - 1 }}>Late</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Text style={dynamicStyles.statusLeave}>LV</Text>
            <Text style={{ fontSize: format.bodyFontSize - 1 }}>Leave</Text>
          </View>
        </View>
      </View>
    </BaseTemplate>
  )
}