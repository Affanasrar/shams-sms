// app/api/admin/fees/reports/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import PDFDocument from 'pdfkit'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') as 'monthly' | 'student' | 'course' | 'overall'
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const studentId = searchParams.get('studentId')
    const courseId = searchParams.get('courseId')

    console.log('Generating report:', { reportType, month, year, studentId, courseId })

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    })

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
    const chunks: Buffer[] = []
    doc.on('data', (chunk) => chunks.push(chunk))
    doc.end()

    return new Promise<NextResponse>((resolve) => {
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks)
        console.log('PDF generated successfully, size:', pdfBuffer.length)
        resolve(new NextResponse(pdfBuffer, { headers }))
      })

      doc.on('error', (error) => {
        console.error('PDF generation error:', error)
        resolve(NextResponse.json({ error: 'PDF generation failed' }, { status: 500 }))
      })
    })

  } catch (error) {
    console.error('Error generating PDF report:', error)
    return NextResponse.json({ 
      error: 'Failed to generate report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function generateMonthlyReport(doc: PDFKit.PDFDocument, month: number, year: number) {
  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' })

  // Header
  doc.fontSize(20).text('SHAMS SMS - Monthly Fees Report', { align: 'center' })
  doc.moveDown()
  doc.fontSize(14).text(`${monthName} ${year}`, { align: 'center' })
  doc.moveDown(2)

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
    doc.fontSize(12).text('No fee data found for the selected month.', { align: 'center' })
    return
  }

  // Summary
  const totalFees = fees.reduce((sum, fee) => sum + Number(fee.finalAmount), 0)
  const totalPaid = fees.reduce((sum, fee) => sum + Number(fee.paidAmount), 0)
  const totalPending = totalFees - totalPaid

  doc.fontSize(12).text(`Total Students: ${new Set(fees.map(f => f.studentId)).size}`)
  doc.text(`Total Fees: PKR ${totalFees.toLocaleString()}`)
  doc.text(`Total Collected: PKR ${totalPaid.toLocaleString()}`)
  doc.text(`Total Pending: PKR ${totalPending.toLocaleString()}`)
  doc.moveDown()

  // Table header
  const tableTop = doc.y
  doc.fontSize(10)
  doc.text('Student ID', 50, tableTop)
  doc.text('Student Name', 120, tableTop)
  doc.text('Course', 250, tableTop)
  doc.text('Total', 350, tableTop)
  doc.text('Paid', 400, tableTop)
  doc.text('Pending', 450, tableTop)
  doc.text('Status', 500, tableTop)

  doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke()

  let y = tableTop + 25
  fees.forEach((fee) => {
    if (y > 700) {
      doc.addPage()
      y = 50
    }

    const pending = Number(fee.finalAmount) - Number(fee.paidAmount)
    const status = pending === 0 ? 'PAID' : Number(fee.paidAmount) > 0 ? 'PARTIAL' : 'UNPAID'

    doc.text(fee.student.studentId, 50, y)
    doc.text(fee.student.name, 120, y, { width: 120 })
    doc.text(fee.enrollment?.courseOnSlot.course.name || 'General', 250, y, { width: 90 })
    doc.text(Number(fee.finalAmount).toLocaleString(), 350, y)
    doc.text(Number(fee.paidAmount).toLocaleString(), 400, y)
    doc.text(pending.toLocaleString(), 450, y)
    doc.text(status, 500, y)

    y += 20
  })
}

async function generateStudentReport(doc: PDFKit.PDFDocument, studentId: string) {
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
    doc.fontSize(12).text('Student not found.', { align: 'center' })
    return
  }

  if (student.fees.length === 0) {
    doc.fontSize(12).text('No fee data found for this student.', { align: 'center' })
    return
  }

  // Header
  doc.fontSize(20).text('SHAMS SMS - Student Fees Report', { align: 'center' })
  doc.moveDown()
  doc.fontSize(14).text(`${student.studentId} - ${student.name}`, { align: 'center' })
  doc.text(`s/o ${student.fatherName}`, { align: 'center' })
  doc.moveDown(2)

  // Summary
  const totalFees = student.fees.reduce((sum, fee) => sum + Number(fee.finalAmount), 0)
  const totalPaid = student.fees.reduce((sum, fee) => sum + Number(fee.paidAmount), 0)
  const totalPending = totalFees - totalPaid

  doc.fontSize(12).text(`Total Fees: PKR ${totalFees.toLocaleString()}`)
  doc.text(`Total Paid: PKR ${totalPaid.toLocaleString()}`)
  doc.text(`Total Pending: PKR ${totalPending.toLocaleString()}`)
  doc.moveDown()

  // Monthly breakdown
  doc.fontSize(12).text('Monthly Fee Details:', { underline: true })
  doc.moveDown()

  let y = doc.y
  student.fees.forEach((fee) => {
    if (y > 700) {
      doc.addPage()
      y = 50
    }

    const monthName = fee.cycleDate.toLocaleString('default', { month: 'long', year: 'numeric' })
    const pending = Number(fee.finalAmount) - Number(fee.paidAmount)

    doc.fontSize(10)
    doc.text(`${monthName}`, 50, y)
    doc.text(fee.enrollment?.courseOnSlot.course.name || 'General', 150, y)
    doc.text(`PKR ${Number(fee.finalAmount).toLocaleString()}`, 300, y)
    doc.text(`PKR ${Number(fee.paidAmount).toLocaleString()}`, 400, y)
    doc.text(`PKR ${pending.toLocaleString()}`, 480, y)

    y += 15
  })
}

async function generateCourseReport(doc: PDFKit.PDFDocument, courseId: string, month: number, year: number) {
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
    doc.fontSize(12).text('Course not found.', { align: 'center' })
    return
  }

  if (course.slotAssignments.length === 0 || course.slotAssignments.every(slot => slot.enrollments.length === 0)) {
    doc.fontSize(12).text('No enrollment data found for this course.', { align: 'center' })
    return
  }

  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' })

  // Header
  doc.fontSize(20).text('SHAMS SMS - Course Fees Report', { align: 'center' })
  doc.moveDown()
  doc.fontSize(14).text(`${course.name} - ${monthName} ${year}`, { align: 'center' })
  doc.moveDown(2)

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

  doc.fontSize(12).text(`Total Students: ${new Set(allFees.map(f => f.studentId)).size}`)
  doc.text(`Total Fees: PKR ${totalFees.toLocaleString()}`)
  doc.text(`Total Collected: PKR ${totalPaid.toLocaleString()}`)
  doc.text(`Total Pending: PKR ${totalPending.toLocaleString()}`)
  doc.moveDown()

  // Student list
  doc.fontSize(12).text('Student Fee Details:', { underline: true })
  doc.moveDown()

  let y = doc.y
  allFees.forEach((fee) => {
    if (y > 700) {
      doc.addPage()
      y = 50
    }

    const pending = Number(fee.finalAmount) - Number(fee.paidAmount)

    doc.fontSize(10)
    doc.text(fee.student.studentId, 50, y)
    doc.text(fee.student.name, 120, y, { width: 120 })
    doc.text(`PKR ${Number(fee.finalAmount).toLocaleString()}`, 250, y)
    doc.text(`PKR ${Number(fee.paidAmount).toLocaleString()}`, 350, y)
    doc.text(`PKR ${pending.toLocaleString()}`, 450, y)

    y += 15
  })
}

async function generateOverallReport(doc: PDFKit.PDFDocument, month: number, year: number) {
  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' })

  // Header
  doc.fontSize(20).text('SHAMS SMS - Overall Fees Report', { align: 'center' })
  doc.moveDown()
  doc.fontSize(14).text(`${monthName} ${year}`, { align: 'center' })
  doc.moveDown(2)

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
    doc.fontSize(12).text('No fee data found for this month.', { align: 'center' })
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

  doc.fontSize(12).text(`Total Students: ${totalStudents}`)
  doc.text(`Total Fees: PKR ${totalFees.toLocaleString()}`)
  doc.text(`Total Collected: PKR ${totalPaid.toLocaleString()}`)
  doc.text(`Total Pending: PKR ${(totalFees - totalPaid).toLocaleString()}`)
  doc.moveDown()

  // Course-wise breakdown
  doc.fontSize(12).text('Course-wise Summary:', { underline: true })
  doc.moveDown()

  let y = doc.y
  courseStats.forEach((stats) => {
    if (y > 700) {
      doc.addPage()
      y = 50
    }

    doc.fontSize(10)
    doc.text(stats.courseName, 50, y, { width: 150 })
    doc.text(`${stats.studentCount.size} students`, 210, y)
    doc.text(`PKR ${stats.totalFees.toLocaleString()}`, 300, y)
    doc.text(`PKR ${stats.totalPaid.toLocaleString()}`, 400, y)
    doc.text(`PKR ${(stats.totalFees - stats.totalPaid).toLocaleString()}`, 480, y)

    y += 15
  })
}