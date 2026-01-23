// app/api/admin/fees/reports/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import jsPDF from 'jspdf'
import fs from 'fs'
import path from 'path'

// Professional table drawing function with modern styling
function drawProfessionalTable(doc: jsPDF, headers: string[], rows: string[][], startY: number, options: {
  headerColor?: [number, number, number],
  alternateRowColor?: [number, number, number],
  borderColor?: [number, number, number],
  textColor?: [number, number, number]
} = {}) {
  const pageWidth = doc.internal.pageSize.width
  const margin = 15 // Reduced margin for more space
  const tableWidth = pageWidth - 2 * margin
  const colWidth = tableWidth / headers.length
  let y = startY

  const {
    headerColor = [52, 152, 219],
    alternateRowColor = [248, 249, 250],
    borderColor = [200, 200, 200],
    textColor = [33, 37, 41]
  } = options

  // Draw table border
  doc.setDrawColor(...borderColor)
  doc.setLineWidth(0.5)
  doc.rect(margin, y - 8, tableWidth, (rows.length + 1) * 10 + 4)

  // Draw header with gradient effect
  doc.setFillColor(...headerColor)
  doc.rect(margin + 1, y - 7, tableWidth - 2, 12, 'F')

  // Add header shadow effect
  doc.setFillColor(0, 0, 0, 0.1)
  doc.rect(margin + 1, y + 3, tableWidth - 2, 2, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8) // Smaller font for headers
  doc.setFont('helvetica', 'bold')

  headers.forEach((header, i) => {
    const x = margin + i * colWidth + colWidth / 2
    doc.text(header, x, y - 1, { align: 'center' })
  })

  y += 8
  doc.setTextColor(...textColor)
  doc.setFontSize(7) // Smaller font for data
  doc.setFont('helvetica', 'normal')

  // Draw rows with alternating colors and borders
  rows.forEach((row, rowIndex) => {
    if (y > 250) { // New page if needed
      doc.addPage()
      y = 50
      // Redraw header on new page
      doc.setFillColor(...headerColor)
      doc.rect(margin + 1, y - 7, tableWidth - 2, 12, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      headers.forEach((header, i) => {
        const x = margin + i * colWidth + colWidth / 2
        doc.text(header, x, y - 1, { align: 'center' })
      })
      y += 8
      doc.setTextColor(...textColor)
      doc.setFont('helvetica', 'normal')
    }

    // Alternate row background
    if (rowIndex % 2 === 0) {
      doc.setFillColor(...alternateRowColor)
      doc.rect(margin + 1, y - 2, tableWidth - 2, 8, 'F')
    }

    // Draw row border
    doc.setDrawColor(...borderColor)
    doc.setLineWidth(0.2)
    doc.line(margin, y + 4, margin + tableWidth, y + 4)

    row.forEach((cell, i) => {
      // Better text truncation and formatting
      let cellText = cell
      if (cell.includes('PKR')) {
        // Format currency amounts to be shorter
        const amount = cell.replace('PKR ', '').replace(/,/g, '')
        const numAmount = parseFloat(amount)
        if (numAmount >= 10000000) {
          cellText = `PKR ${(numAmount / 10000000).toFixed(1)}Cr`
        } else if (numAmount >= 100000) {
          cellText = `PKR ${(numAmount / 100000).toFixed(1)}L`
        } else if (numAmount >= 1000) {
          cellText = `PKR ${(numAmount / 1000).toFixed(0)}K`
        } else {
          cellText = cell.length > 12 ? `PKR ${numAmount.toFixed(0)}` : cell
        }
      } else {
        cellText = cell.length > 15 ? cell.substring(0, 12) + '...' : cell
      }

      const x = margin + i * colWidth + colWidth / 2
      doc.text(cellText, x, y + 2, { align: 'center' })
    })

    y += 8
  })
}

// Function to draw summary cards
function drawSummaryCard(doc: jsPDF, x: number, y: number, width: number, height: number, title: string, value: string, color: [number, number, number]) {
  // Card background with gradient effect
  doc.setFillColor(...color)
  doc.rect(x, y, width, height, 'F')

  // Card border
  doc.setDrawColor(color[0] - 20, color[1] - 20, color[2] - 20)
  doc.setLineWidth(1)
  doc.rect(x, y, width, height)

  // Inner shadow effect
  doc.setFillColor(255, 255, 255, 0.1)
  doc.rect(x + 2, y + 2, width - 4, height - 4, 'F')

  // Title
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(title, x + width / 2, y + 8, { align: 'center' })

  // Value
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(value, x + width / 2, y + 18, { align: 'center' })
}

// Function to draw professional header with logo
function drawHeader(doc: jsPDF, title: string, subtitle: string = '') {
  const pageWidth = doc.internal.pageSize.width

  // Header background gradient
  doc.setFillColor(41, 128, 185)
  doc.rect(0, 0, pageWidth, 45, 'F')

  // Add gradient effect
  doc.setFillColor(52, 152, 219)
  doc.rect(0, 30, pageWidth, 15, 'F')

  // Add logo (automatically loaded from file system)
  addLogoToHeader(doc)

  // Institution name with shadow - adjusted font size for better fit
  doc.setTextColor(255, 255, 255, 0.3)
  doc.setFontSize(18)  // Reduced from 20 to fit better
  doc.setFont('helvetica', 'bold')
  doc.text('SHAMS COMMERCIAL INSTITUTE', pageWidth / 2, 20)

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)  // Reduced from 20 to fit better
  doc.text('SHAMS COMMERCIAL INSTITUTE', pageWidth / 2, 18)

  // Report title
  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.text(title, pageWidth / 2, 32, { align: 'center' })

  if (subtitle) {
    doc.setFontSize(11)
    doc.text(subtitle, pageWidth / 2, 40, { align: 'center' })
  }

  // Decorative line
  doc.setDrawColor(255, 255, 255)
  doc.setLineWidth(1)
  doc.line(20, 47, pageWidth - 20, 47)
}

// Function to draw footer
function drawFooter(doc: jsPDF, pageNumber: number = 1) {
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height

  // Footer background
  doc.setFillColor(248, 249, 250)
  doc.rect(0, pageHeight - 20, pageWidth, 20, 'F')

  // Footer line
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.5)
  doc.line(15, pageHeight - 20, pageWidth - 15, pageHeight - 20)

  // Footer text
  doc.setTextColor(100, 100, 100)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')

  const currentDate = new Date().toLocaleDateString()
  doc.text(`Generated on: ${currentDate}`, 15, pageHeight - 12)
  doc.text(`Page ${pageNumber}`, pageWidth - 15, pageHeight - 12, { align: 'right' })

  // Institution info
  doc.setFontSize(6)
  doc.text('Shams Commercial Institute - Professional Fee Reports', pageWidth / 2, pageHeight - 6, { align: 'center' })
}

// Function to load logo from file system
function loadLogoFromFile(): string | null {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'assets', 'images', 'logo.png')
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath)
      const base64Logo = logoBuffer.toString('base64')
      return `data:image/png;base64,${base64Logo}`
    }

    // Try other common formats
    const formats = ['jpg', 'jpeg', 'svg']
    for (const format of formats) {
      const altLogoPath = path.join(process.cwd(), 'public', 'assets', 'images', `logo.${format}`)
      if (fs.existsSync(altLogoPath)) {
        const logoBuffer = fs.readFileSync(altLogoPath)
        const mimeType = format === 'svg' ? 'image/svg+xml' : `image/${format}`
        const base64Logo = logoBuffer.toString('base64')
        return `data:${mimeType};base64,${base64Logo}`
      }
    }

    return null // No logo found
  } catch (error) {
    console.warn('Failed to load logo from file system:', error)
    return null
  }
}

// Function to add logo to header (accepts base64 image data)
function addLogoToHeader(doc: jsPDF, logoData?: string) {
  const logoToUse = logoData || loadLogoFromFile()

  if (!logoToUse) {
    // Draw default logo if no image provided
    doc.setFillColor(255, 255, 255)
    doc.rect(15, 8, 25, 25, 'F')

    // Simple logo design
    doc.setFillColor(231, 76, 60) // Red circle for logo
    doc.circle(27.5, 20.5, 8, 'F')

    // White "S" in logo
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('S', 24, 24)
    return
  }

  try {
    // Add actual logo image
    doc.addImage(logoToUse, 'PNG', 15, 8, 25, 25)
  } catch (error) {
    console.warn('Failed to load logo, using default:', error)
    // Fallback to default logo
    doc.setFillColor(255, 255, 255)
    doc.rect(15, 8, 25, 25, 'F')
    doc.setFillColor(231, 76, 60)
    doc.circle(27.5, 20.5, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('S', 24, 24)
  }
}

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

  // Professional header
  drawHeader(doc, 'Monthly Fees Report', `${monthName} ${year}`)

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
    doc.setFontSize(14)
    doc.setTextColor(100, 100, 100)
    doc.text('No fee data found for the selected month.', 105, 80, { align: 'center' })
    drawFooter(doc)
    return
  }

  // Summary statistics
  const totalFees = fees.reduce((sum, fee) => sum + Number(fee.finalAmount), 0)
  const totalPaid = fees.reduce((sum, fee) => sum + Number(fee.paidAmount), 0)
  const totalPending = totalFees - totalPaid
  const totalStudents = new Set(fees.map(f => f.studentId)).size

  // Summary cards - adjusted for proper fit
  const cardWidth = 42  // Reduced width to fit 4 cards
  const cardHeight = 25
  const cardSpacing = 8  // Reduced spacing
  const startX = 15  // Adjusted margin
  let currentX = startX

  drawSummaryCard(doc, currentX, 50, cardWidth, cardHeight, 'Total Students', totalStudents.toString(), [52, 152, 219])
  currentX += cardWidth + cardSpacing

  drawSummaryCard(doc, currentX, 50, cardWidth, cardHeight, 'Total Fees', `PKR ${totalFees.toLocaleString()}`, [46, 204, 113])
  currentX += cardWidth + cardSpacing

  drawSummaryCard(doc, currentX, 50, cardWidth, cardHeight, 'Collected', `PKR ${totalPaid.toLocaleString()}`, [46, 204, 113])
  currentX += cardWidth + cardSpacing

  drawSummaryCard(doc, currentX, 50, cardWidth, cardHeight, 'Pending', `PKR ${totalPending.toLocaleString()}`, [231, 76, 60])

  // Section title
  doc.setTextColor(33, 37, 41)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Detailed Fee Breakdown', 20, 95)

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

  // Generate professional table
  drawProfessionalTable(doc,
    ['Student ID', 'Name', 'Course', 'Total', 'Paid', 'Pending', 'Status'],
    tableData,
    105,
    {
      headerColor: [52, 152, 219],
      alternateRowColor: [248, 249, 250],
      borderColor: [200, 200, 200],
      textColor: [33, 37, 41]
    }
  )

  drawFooter(doc)
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
    drawHeader(doc, 'Student Fees Report', 'Student Not Found')
    doc.setFontSize(14)
    doc.setTextColor(100, 100, 100)
    doc.text('Student not found in the system.', 105, 80, { align: 'center' })
    drawFooter(doc)
    return
  }

  if (student.fees.length === 0) {
    drawHeader(doc, 'Student Fees Report', `${student.studentId} - ${student.name}`)
    doc.setFontSize(14)
    doc.setTextColor(100, 100, 100)
    doc.text('No fee data found for this student.', 105, 80, { align: 'center' })
    drawFooter(doc)
    return
  }

  // Professional header
  drawHeader(doc, 'Student Fees Report', `${student.studentId} - ${student.name}`)

  // Student info box
  doc.setFillColor(248, 249, 250)
  doc.rect(20, 45, 170, 20, 'F')
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.5)
  doc.rect(20, 45, 170, 20)

  doc.setTextColor(33, 37, 41)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Student Information:', 25, 52)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Name: ${student.name}`, 25, 58)
  doc.text(`Father: ${student.fatherName}`, 25, 63)
  doc.text(`Student ID: ${student.studentId}`, 120, 58)

  // Summary statistics
  const totalFees = student.fees.reduce((sum, fee) => sum + Number(fee.finalAmount), 0)
  const totalPaid = student.fees.reduce((sum, fee) => sum + Number(fee.paidAmount), 0)
  const totalPending = totalFees - totalPaid

  // Summary cards - adjusted for proper fit
  const cardWidth = 42  // Consistent width with other reports
  const cardHeight = 25
  const cardSpacing = 8  // Consistent spacing
  const startX = 15  // Adjusted margin
  let currentX = startX

  drawSummaryCard(doc, currentX, 75, cardWidth, cardHeight, 'Total Fees', `PKR ${totalFees.toLocaleString()}`, [52, 152, 219])
  currentX += cardWidth + cardSpacing

  drawSummaryCard(doc, currentX, 75, cardWidth, cardHeight, 'Total Paid', `PKR ${totalPaid.toLocaleString()}`, [46, 204, 113])
  currentX += cardWidth + cardSpacing

  drawSummaryCard(doc, currentX, 75, cardWidth, cardHeight, 'Pending', `PKR ${totalPending.toLocaleString()}`, [231, 76, 60])

  // Section title
  doc.setTextColor(33, 37, 41)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Monthly Fee Breakdown', 20, 115)

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

  drawProfessionalTable(doc,
    ['Month', 'Course', 'Total', 'Paid', 'Pending'],
    tableData,
    125,
    {
      headerColor: [155, 89, 182],
      alternateRowColor: [248, 249, 250],
      borderColor: [200, 200, 200],
      textColor: [33, 37, 41]
    }
  )

  drawFooter(doc)
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
    drawHeader(doc, 'Course Fees Report', 'Course Not Found')
    doc.setFontSize(14)
    doc.setTextColor(100, 100, 100)
    doc.text('Course not found in the system.', 105, 80, { align: 'center' })
    drawFooter(doc)
    return
  }

  if (course.slotAssignments.length === 0 || course.slotAssignments.every(slot => slot.enrollments.length === 0)) {
    drawHeader(doc, 'Course Fees Report', course.name)
    doc.setFontSize(14)
    doc.setTextColor(100, 100, 100)
    doc.text('No enrollment data found for this course.', 105, 80, { align: 'center' })
    drawFooter(doc)
    return
  }

  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' })

  // Professional header
  drawHeader(doc, 'Course Fees Report', `${course.name} - ${monthName} ${year}`)

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

  // Summary statistics
  const totalFees = allFees.reduce((sum, fee) => sum + Number(fee.finalAmount), 0)
  const totalPaid = allFees.reduce((sum, fee) => sum + Number(fee.paidAmount), 0)
  const totalPending = totalFees - totalPaid
  const totalStudents = new Set(allFees.map(f => f.studentId)).size

  // Summary cards - adjusted for proper fit
  const cardWidth = 42  // Reduced width to fit 4 cards
  const cardHeight = 25
  const cardSpacing = 8  // Reduced spacing
  const startX = 15  // Adjusted margin
  let currentX = startX

  drawSummaryCard(doc, currentX, 50, cardWidth, cardHeight, 'Total Students', totalStudents.toString(), [52, 152, 219])
  currentX += cardWidth + cardSpacing

  drawSummaryCard(doc, currentX, 50, cardWidth, cardHeight, 'Course Fees', `PKR ${totalFees.toLocaleString()}`, [46, 204, 113])
  currentX += cardWidth + cardSpacing

  drawSummaryCard(doc, currentX, 50, cardWidth, cardHeight, 'Collected', `PKR ${totalPaid.toLocaleString()}`, [46, 204, 113])
  currentX += cardWidth + cardSpacing

  drawSummaryCard(doc, currentX, 50, cardWidth, cardHeight, 'Pending', `PKR ${totalPending.toLocaleString()}`, [231, 76, 60])

  // Section title
  doc.setTextColor(33, 37, 41)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Student Fee Details', 20, 95)

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

  drawProfessionalTable(doc,
    ['Student ID', 'Name', 'Total', 'Paid', 'Pending'],
    tableData,
    105,
    {
      headerColor: [230, 126, 34],
      alternateRowColor: [248, 249, 250],
      borderColor: [200, 200, 200],
      textColor: [33, 37, 41]
    }
  )

  drawFooter(doc)
}

async function generateOverallReport(doc: jsPDF, month: number, year: number) {
  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' })

  // Professional header
  drawHeader(doc, 'Overall Fees Report', `${monthName} ${year}`)

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
    doc.setFontSize(14)
    doc.setTextColor(100, 100, 100)
    doc.text('No fee data found for this month.', 105, 80, { align: 'center' })
    drawFooter(doc)
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

  // Overall summary statistics
  const totalFees = fees.reduce((sum, fee) => sum + Number(fee.finalAmount), 0)
  const totalPaid = fees.reduce((sum, fee) => sum + Number(fee.paidAmount), 0)
  const totalPending = totalFees - totalPaid
  const totalStudents = new Set(fees.map(f => f.studentId)).size
  const totalCourses = courseStats.size

  // Summary cards
  const cardWidth = 45
  const cardHeight = 25
  let currentX = 20

  drawSummaryCard(doc, currentX, 50, cardWidth, cardHeight, 'Total Students', totalStudents.toString(), [52, 152, 219])
  currentX += cardWidth + 8

  drawSummaryCard(doc, currentX, 50, cardWidth, cardHeight, 'Total Courses', totalCourses.toString(), [155, 89, 182])
  currentX += cardWidth + 8

  drawSummaryCard(doc, currentX, 50, cardWidth, cardHeight, 'Total Fees', `PKR ${totalFees.toLocaleString()}`, [46, 204, 113])
  currentX += cardWidth + 8

  drawSummaryCard(doc, currentX, 50, cardWidth, cardHeight, 'Collected', `PKR ${totalPaid.toLocaleString()}`, [46, 204, 113])
  currentX += cardWidth + 8

  drawSummaryCard(doc, currentX, 50, cardWidth, cardHeight, 'Pending', `PKR ${totalPending.toLocaleString()}`, [231, 76, 60])

  // Section title
  doc.setTextColor(33, 37, 41)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Course-wise Fee Breakdown', 20, 95)

  // Course-wise breakdown table
  const tableData = Array.from(courseStats.values()).map(stats => [
    stats.courseName,
    `${stats.studentCount.size}`,
    `PKR ${stats.totalFees.toLocaleString()}`,
    `PKR ${stats.totalPaid.toLocaleString()}`,
    `PKR ${(stats.totalFees - stats.totalPaid).toLocaleString()}`
  ])

  drawProfessionalTable(doc,
    ['Course', 'Students', 'Total Fees', 'Collected', 'Pending'],
    tableData,
    105,
    {
      headerColor: [44, 62, 80],
      alternateRowColor: [248, 249, 250],
      borderColor: [200, 200, 200],
      textColor: [33, 37, 41]
    }
  )

  drawFooter(doc)
}