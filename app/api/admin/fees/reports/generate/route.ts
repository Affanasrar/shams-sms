// app/api/admin/fees/reports/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') as 'monthly' | 'student' | 'course' | 'overall'
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const studentId = searchParams.get('studentId')
    const courseId = searchParams.get('courseId')

    console.log('Generating report:', { reportType, month, year, studentId, courseId })

    // Create PDF document using jsPDF (serverless-friendly)
    const doc = new jsPDF()

    // Set response headers for PDF download
    const headers = new Headers()
    headers.set('Content-Type', 'application/pdf')
    headers.set('Content-Disposition', `attachment; filename="${reportType}-report-${month}-${year}.pdf"`)

    // Generate report based on type
    switch (reportType) {
      case 'monthly':
        await generateMonthlyReport(doc, month, year)
        break
      case 'student':
        if (!studentId) throw new Error('Student ID required for student report')
        await generateStudentReport(doc, studentId)
        break
      case 'course':
        if (!courseId) throw new Error('Course ID required for course report')
        await generateCourseReport(doc, courseId, month, year)
        break
      case 'overall':
        await generateOverallReport(doc, month, year)
        break
      default:
        throw new Error(`Invalid report type: ${reportType}`)
    }

    // Convert PDF to buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    console.log('PDF generated successfully, size:', pdfBuffer.length)

    return new NextResponse(pdfBuffer, { headers })

  } catch (error) {
    console.error('Error generating PDF report:', error)
    return NextResponse.json({ 
      error: 'Failed to generate report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function generateMonthlyReport(doc: jsPDF, month: number, year: number) {
  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' })

  // Header
  doc.setFontSize(20)
  doc.text('SHAMS SMS - Monthly Fees Report', 105, 20, { align: 'center' })
  doc.setFontSize(14)
  doc.text(`${monthName} ${year}`, 105, 35, { align: 'center' })

  // Fetch data
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 1)

  const fees = await prisma.fee.findMany({
    where: {
      cycleDate: { gte: startDate, lt: endDate }
    },
    include: {
      student: true,
      enrollment: {
        include: {
          courseOnSlot: { include: { course: true } }
        }
      },
      transactions: { orderBy: { date: 'desc' } }
    },
    orderBy: { student: { name: 'asc' } }
  })

  if (fees.length === 0) {
    doc.setFontSize(12)
    doc.text('No fee data found for the selected month.', 105, 50, { align: 'center' })
    return
  }

  // Summary
  const totalFees = fees.reduce((sum, fee) => sum + Number(fee.finalAmount), 0)
  const totalPaid = fees.reduce((sum, fee) => sum + Number(fee.paidAmount), 0)
  const totalPending = totalFees - totalPaid

  doc.setFontSize(12)
  doc.text(`Total Students: ${new Set(fees.map(f => f.studentId)).size}`, 20, 50)
  doc.text(`Total Fees: PKR ${totalFees.toLocaleString()}`, 20, 60)
  doc.text(`Total Collected: PKR ${totalPaid.toLocaleString()}`, 20, 70)
  doc.text(`Total Pending: PKR ${totalPending.toLocaleString()}`, 20, 80)

  // Create table data
  const tableData = fees.map(fee => {
    const pending = Number(fee.finalAmount) - Number(fee.paidAmount)
    const status = pending === 0 ? 'PAID' : Number(fee.paidAmount) > 0 ? 'PARTIAL' : 'UNPAID'

    return [
      fee.student.studentId,
      fee.student.name,
      fee.enrollment?.courseOnSlot.course.name || 'General',
      `PKR ${Number(fee.finalAmount).toLocaleString()}`,
      `PKR ${Number(fee.paidAmount).toLocaleString()}`,
      `PKR ${pending.toLocaleString()}`,
      status
    ]
  })

  // Generate table
  ;(doc as any).autoTable({
    head: [['Student ID', 'Name', 'Course', 'Total', 'Paid', 'Pending', 'Status']],
    body: tableData,
    startY: 90,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185] },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 40 },
      2: { cellWidth: 35 },
      3: { cellWidth: 25 },
      4: { cellWidth: 25 },
      5: { cellWidth: 25 },
      6: { cellWidth: 20 }
    }
  })
}

async function generateStudentReport(doc: jsPDF, studentId: string) {
  const student = await prisma.student.findUnique({
    where: { studentId },
    include: {
      fees: {
        include: {
          enrollment: {
            include: {
              courseOnSlot: { include: { course: true } }
            }
          },
          transactions: { orderBy: { date: 'desc' } }
        },
        orderBy: { cycleDate: 'asc' }
      }
    }
  })

  if (!student) {
    doc.setFontSize(12)
    doc.text('Student not found.', 105, 50, { align: 'center' })
    return
  }

  if (student.fees.length === 0) {
    doc.setFontSize(12)
    doc.text('No fee data found for this student.', 105, 50, { align: 'center' })
    return
  }

  // Header
  doc.setFontSize(20)
  doc.text('SHAMS SMS - Student Fees Report', 105, 20, { align: 'center' })
  doc.setFontSize(14)
  doc.text(`${student.studentId} - ${student.name}`, 105, 35, { align: 'center' })
  doc.text(`s/o ${student.fatherName}`, 105, 45, { align: 'center' })

  // Summary
  const totalFees = student.fees.reduce((sum, fee) => sum + Number(fee.finalAmount), 0)
  const totalPaid = student.fees.reduce((sum, fee) => sum + Number(fee.paidAmount), 0)
  const totalPending = totalFees - totalPaid

  doc.setFontSize(12)
  doc.text(`Total Fees: PKR ${totalFees.toLocaleString()}`, 20, 60)
  doc.text(`Total Paid: PKR ${totalPaid.toLocaleString()}`, 20, 70)
  doc.text(`Total Pending: PKR ${totalPending.toLocaleString()}`, 20, 80)

  // Monthly breakdown table
  const tableData = student.fees.map(fee => {
    const monthName = fee.cycleDate.toLocaleString('default', { month: 'long', year: 'numeric' })
    const pending = Number(fee.finalAmount) - Number(fee.paidAmount)

    return [
      monthName,
      fee.enrollment?.courseOnSlot.course.name || 'General',
      `PKR ${Number(fee.finalAmount).toLocaleString()}`,
      `PKR ${Number(fee.paidAmount).toLocaleString()}`,
      `PKR ${pending.toLocaleString()}`
    ]
  })

  ;(doc as any).autoTable({
    head: [['Month', 'Course', 'Total', 'Paid', 'Pending']],
    body: tableData,
    startY: 90,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185] }
  })
}

async function generateCourseReport(doc: jsPDF, courseId: string, month: number, year: number) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      slotAssignments: {
        include: {
          enrollments: {
            where: { status: 'ACTIVE' },
            include: {
              student: true,
              fees: {
                where: {
                  cycleDate: {
                    gte: new Date(year, month - 1, 1),
                    lt: new Date(year, month, 1)
                  }
                }
              }
            }
          }
        }
      }
    }
  })

  if (!course) {
    doc.setFontSize(12)
    doc.text('Course not found.', 105, 50, { align: 'center' })
    return
  }

  if (course.slotAssignments.length === 0 || course.slotAssignments.every(slot => slot.enrollments.length === 0)) {
    doc.setFontSize(12)
    doc.text('No enrollment data found for this course.', 105, 50, { align: 'center' })
    return
  }

  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' })

  // Header
  doc.setFontSize(20)
  doc.text('SHAMS SMS - Course Fees Report', 105, 20, { align: 'center' })
  doc.setFontSize(14)
  doc.text(`${course.name} - ${monthName} ${year}`, 105, 35, { align: 'center' })

  // Collect all fees
  const allFees: any[] = []
  course.slotAssignments.forEach(slot => {
    slot.enrollments.forEach(enrollment => {
      enrollment.fees.forEach(fee => {
        allFees.push({
          ...fee,
          student: enrollment.student,
          courseName: course.name
        })
      })
    })
  })

  // Summary
  const totalFees = allFees.reduce((sum, fee) => sum + Number(fee.finalAmount), 0)
  const totalPaid = allFees.reduce((sum, fee) => sum + Number(fee.paidAmount), 0)
  const totalPending = totalFees - totalPaid

  doc.setFontSize(12)
  doc.text(`Total Students: ${new Set(allFees.map(f => f.studentId)).size}`, 20, 50)
  doc.text(`Total Fees: PKR ${totalFees.toLocaleString()}`, 20, 60)
  doc.text(`Total Collected: PKR ${totalPaid.toLocaleString()}`, 20, 70)
  doc.text(`Total Pending: PKR ${totalPending.toLocaleString()}`, 20, 80)

  // Student table
  const tableData = allFees.map(fee => {
    const pending = Number(fee.finalAmount) - Number(fee.paidAmount)
    return [
      fee.student.studentId,
      fee.student.name,
      `PKR ${Number(fee.finalAmount).toLocaleString()}`,
      `PKR ${Number(fee.paidAmount).toLocaleString()}`,
      `PKR ${pending.toLocaleString()}`
    ]
  })

  ;(doc as any).autoTable({
    head: [['Student ID', 'Name', 'Total', 'Paid', 'Pending']],
    body: tableData,
    startY: 90,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185] }
  })
}

async function generateOverallReport(doc: jsPDF, month: number, year: number) {
  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' })

  // Header
  doc.setFontSize(20)
  doc.text('SHAMS SMS - Overall Fees Report', 105, 20, { align: 'center' })
  doc.setFontSize(14)
  doc.text(`${monthName} ${year}`, 105, 35, { align: 'center' })

  // Get all fees for the month
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 1)

  const fees = await prisma.fee.findMany({
    where: {
      cycleDate: { gte: startDate, lt: endDate }
    },
    include: {
      student: true,
      enrollment: {
        include: {
          courseOnSlot: { include: { course: true } }
        }
      }
    }
  })

  if (fees.length === 0) {
    doc.setFontSize(12)
    doc.text('No fee data found for this month.', 105, 50, { align: 'center' })
    return
  }

  // Group by course
  const courseStats = new Map()

  fees.forEach(fee => {
    const courseName = fee.enrollment?.courseOnSlot.course.name || 'General Fee'
    if (!courseStats.has(courseName)) {
      courseStats.set(courseName, {
        courseName,
        totalFees: 0,
        totalPaid: 0,
        studentCount: new Set()
      })
    }

    const stats = courseStats.get(courseName)
    stats.totalFees += Number(fee.finalAmount)
    stats.totalPaid += Number(fee.paidAmount)
    stats.studentCount.add(fee.studentId)
  })

  // Overall summary
  const totalFees = fees.reduce((sum, fee) => sum + Number(fee.finalAmount), 0)
  const totalPaid = fees.reduce((sum, fee) => sum + Number(fee.paidAmount), 0)
  const totalStudents = new Set(fees.map(f => f.studentId)).size

  doc.setFontSize(12)
  doc.text(`Total Students: ${totalStudents}`, 20, 50)
  doc.text(`Total Fees: PKR ${totalFees.toLocaleString()}`, 20, 60)
  doc.text(`Total Collected: PKR ${totalPaid.toLocaleString()}`, 20, 70)
  doc.text(`Total Pending: PKR ${(totalFees - totalPaid).toLocaleString()}`, 20, 80)

  // Course-wise breakdown table
  const tableData = Array.from(courseStats.values()).map(stats => [
    stats.courseName,
    `${stats.studentCount.size} students`,
    `PKR ${stats.totalFees.toLocaleString()}`,
    `PKR ${stats.totalPaid.toLocaleString()}`,
    `PKR ${(stats.totalFees - stats.totalPaid).toLocaleString()}`
  ])

  ;(doc as any).autoTable({
    head: [['Course', 'Students', 'Total Fees', 'Collected', 'Pending']],
    body: tableData,
    startY: 90,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185] }
  })
}