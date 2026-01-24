// app/api/admin/fees/reports/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { renderToBuffer } from '@react-pdf/renderer'
import { MonthlyReport, StudentReport, CourseReport, OverallReport } from '@/components/pdf'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as 'monthly' | 'student' | 'course' | 'overall'
    const month = parseInt(searchParams.get('month') || '0')
    const year = parseInt(searchParams.get('year') || '0')
    const studentId = searchParams.get('studentId')
    const courseId = searchParams.get('courseId')

    const generatedAt = new Date()

    let pdfBuffer: Buffer

    switch (type) {
      case 'monthly':
        const monthlyData = await generateMonthlyReport(month, year)
        const monthlyDoc = <MonthlyReport data={monthlyData} generatedAt={generatedAt} />
        pdfBuffer = await renderToBuffer(monthlyDoc)
        break

      case 'student':
        if (!studentId) {
          return NextResponse.json({ error: 'Student ID required' }, { status: 400 })
        }
        const studentData = await generateStudentReport(studentId)
        const studentDoc = <StudentReport data={studentData} generatedAt={generatedAt} />
        pdfBuffer = await renderToBuffer(studentDoc)
        break

      case 'course':
        if (!courseId) {
          return NextResponse.json({ error: 'Course ID required' }, { status: 400 })
        }
        const courseData = await generateCourseReport(courseId)
        const courseDoc = <CourseReport data={courseData} generatedAt={generatedAt} />
        pdfBuffer = await renderToBuffer(courseDoc)
        break

      case 'overall':
        const overallData = await generateOverallReport()
        const overallDoc = <OverallReport data={overallData} generatedAt={generatedAt} />
        pdfBuffer = await renderToBuffer(overallDoc)
        break

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }

    // Return PDF as response
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${type}-report-${generatedAt.toISOString().split('T')[0]}.pdf"`,
      },
    })

  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}

async function generateMonthlyReport(month: number, year: number) {
  // Get all fees for the specified month using cycleDate
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 1)

  const fees = await prisma.fee.findMany({
    where: {
      cycleDate: {
        gte: startDate,
        lt: endDate
      }
    },
    include: {
      student: true,
      enrollment: {
        include: {
          courseOnSlot: {
            include: {
              course: true
            }
          }
        }
      },
      transactions: {
        orderBy: {
          date: 'desc'
        },
        take: 1
      }
    },
    orderBy: [
      { student: { studentId: 'asc' } }
    ]
  })

  // Calculate totals
  const totalCollected = fees
    .filter(f => f.status === 'PAID')
    .reduce((sum, f) => sum + Number(f.amount), 0)

  const totalPending = fees
    .filter(f => f.status === 'UNPAID' || f.status === 'PARTIAL')
    .reduce((sum, f) => sum + Number(f.amount), 0)

  const totalStudents = new Set(fees.map(f => f.studentId)).size

  return {
    month,
    year,
    totalCollected,
    totalPending,
    totalStudents,
    fees: fees.map(fee => ({
      id: fee.id,
      studentId: fee.student.studentId,
      studentName: fee.student.name,
      fatherName: fee.student.fatherName,
      courseName: fee.enrollment?.courseOnSlot?.course?.name || 'Unknown Course',
      amount: Number(fee.amount),
      status: fee.status,
      dueDate: fee.dueDate,
      paidDate: fee.transactions[0]?.date
    }))
  }
}

async function generateStudentReport(studentId: string) {
  // Get student details
  const student = await prisma.student.findUnique({
    where: { studentId }
  })

  if (!student) {
    throw new Error('Student not found')
  }

  // Get all fees for this student
  const fees = await prisma.fee.findMany({
    where: { studentId: student.id },
    include: {
      enrollment: {
        include: {
          courseOnSlot: {
            include: {
              course: true
            }
          }
        }
      },
      transactions: {
        orderBy: {
          date: 'desc'
        },
        take: 1
      }
    },
    orderBy: [
      { cycleDate: 'desc' }
    ]
  })

  // Calculate totals
  const totalPaid = fees
    .filter(f => f.status === 'PAID')
    .reduce((sum, f) => sum + Number(f.amount), 0)

  const totalPending = fees
    .filter(f => f.status === 'UNPAID' || f.status === 'PARTIAL')
    .reduce((sum, f) => sum + Number(f.amount), 0)

  const totalFees = totalPaid + totalPending

  return {
    student: {
      id: student.id,
      studentId: student.studentId,
      name: student.name,
      fatherName: student.fatherName,
      phone: student.phone,
      admission: student.admission
    },
    totalPaid,
    totalPending,
    totalFees,
    fees: fees.map(fee => ({
      id: fee.id,
      courseName: fee.enrollment?.courseOnSlot?.course?.name || 'Unknown Course',
      amount: Number(fee.amount),
      status: fee.status,
      dueDate: fee.dueDate,
      paidDate: fee.transactions[0]?.date,
      month: fee.cycleDate.getMonth() + 1,
      year: fee.cycleDate.getFullYear()
    }))
  }
}

async function generateCourseReport(courseId: string) {
  // Get course details
  const course = await prisma.course.findUnique({
    where: { id: courseId }
  })

  if (!course) {
    throw new Error('Course not found')
  }

  // Get all enrollments for this course
  const enrollments = await prisma.enrollment.findMany({
    where: {
      courseOnSlot: {
        courseId: courseId
      },
      status: 'ACTIVE'
    },
    include: {
      student: true,
      fees: true
    }
  })

  // Calculate data for each student
  const students = await Promise.all(
    enrollments.map(async (enrollment) => {
      const fees = await prisma.fee.findMany({
        where: { enrollmentId: enrollment.id },
        include: {
          transactions: {
            orderBy: {
              date: 'desc'
            },
            take: 1
          }
        }
      })

      const totalPaid = fees
        .filter(f => f.status === 'PAID')
        .reduce((sum, f) => sum + Number(f.amount), 0)

      const totalPending = fees
        .filter(f => f.status === 'UNPAID' || f.status === 'PARTIAL')
        .reduce((sum, f) => sum + Number(f.amount), 0)

      const lastPayment = fees
        .filter(f => f.transactions.length > 0)
        .sort((a, b) => new Date(b.transactions[0].date).getTime() - new Date(a.transactions[0].date).getTime())[0]?.transactions[0].date

      return {
        id: enrollment.student.id,
        studentId: enrollment.student.studentId,
        name: enrollment.student.name,
        fatherName: enrollment.student.fatherName,
        totalPaid,
        totalPending,
        lastPayment
      }
    })
  )

  // Calculate totals
  const totalCollected = students.reduce((sum, s) => sum + s.totalPaid, 0)
  const totalPending = students.reduce((sum, s) => sum + s.totalPending, 0)
  const totalStudents = students.length

  return {
    course: {
      id: course.id,
      name: course.name,
      durationMonths: course.durationMonths,
      baseFee: Number(course.baseFee),
      feeType: course.feeType
    },
    totalStudents,
    totalCollected,
    totalPending,
    students
  }
}

async function generateOverallReport() {
  // Get all courses with enrollment counts
  const courses = await prisma.course.findMany({
    include: {
      _count: {
        select: {
          slotAssignments: {
            where: {
              enrollments: {
                some: {
                  status: 'ACTIVE'
                }
              }
            }
          }
        }
      }
    }
  })

  // Get course-wise collection data
  const courseData = await Promise.all(
    courses.map(async (course) => {
      const enrollments = await prisma.enrollment.findMany({
        where: {
          courseOnSlot: {
            courseId: course.id
          },
          status: 'ACTIVE'
        },
        include: {
          fees: true
        }
      })

      const collected = enrollments.flatMap(e => e.fees)
        .filter(f => f.status === 'PAID')
        .reduce((sum, f) => sum + Number(f.amount), 0)

      const pending = enrollments.flatMap(e => e.fees)
        .filter(f => f.status === 'UNPAID' || f.status === 'PARTIAL')
        .reduce((sum, f) => sum + Number(f.amount), 0)

      return {
        id: course.id,
        name: course.name,
        studentCount: course._count.slotAssignments,
        collected,
        pending
      }
    })
  )

  // Get monthly data for the last 12 months
  const monthlyData = []
  const now = new Date()

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const month = date.getMonth() + 1
    const year = date.getFullYear()
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 1)

    const fees = await prisma.fee.findMany({
      where: {
        cycleDate: {
          gte: startDate,
          lt: endDate
        }
      }
    })

    const collected = fees
      .filter(f => f.status === 'PAID')
      .reduce((sum, f) => sum + Number(f.amount), 0)

    const pending = fees
      .filter(f => f.status === 'UNPAID' || f.status === 'PARTIAL')
      .reduce((sum, f) => sum + Number(f.amount), 0)

    monthlyData.push({ month, year, collected, pending })
  }

  // Calculate totals
  const totalStudents = await prisma.student.count()
  const totalCourses = courses.length
  const totalCollected = courseData.reduce((sum, c) => sum + c.collected, 0)
  const totalPending = courseData.reduce((sum, c) => sum + c.pending, 0)

  return {
    totalStudents,
    totalCourses,
    totalCollected,
    totalPending,
    courses: courseData,
    monthlyData
  }
}
