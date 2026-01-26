// app/api/cron/fees/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Function name must be GET (uppercase)
export async function GET() {
  try {
    console.log("⏳ Daily Cron Job Started: Checking current month fees...")

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() // 0-based

    // Create cycle date for current month (1st of current month)
    const cycleDate = new Date(currentYear, currentMonth, 1)

    console.log(`📅 Processing current month fees for: ${cycleDate.toISOString().split('T')[0]}`)

    // Get all active enrollments with course details
    const activeEnrollments = await prisma.enrollment.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        courseOnSlot: {
          include: {
            course: true
          }
        },
        student: true,
        fees: {
          where: {
            cycleDate: cycleDate
          }
        }
      }
    })

    console.log(`📚 Found ${activeEnrollments.length} active enrollments`)

    let feesCreated = 0
    let feesSkipped = 0

    for (const enrollment of activeEnrollments) {
      const course = enrollment.courseOnSlot.course

      // Skip if not a monthly fee course
      if (course.feeType !== 'MONTHLY') {
        continue
      }

      // Check if fee already exists for this cycle
      if (enrollment.fees.length > 0) {
        feesSkipped++
        continue
      }

      // Calculate which month this is for the student (1-based)
      const joiningDate = enrollment.joiningDate
      const monthsDiff = (currentYear - joiningDate.getFullYear()) * 12 +
                        (currentMonth - joiningDate.getMonth())

      const monthNumber = monthsDiff + 1 // 1-based month number

      // Check if we're still within the course duration
      if (monthNumber > course.durationMonths) {
        continue
      }

      // Calculate due date based on student's joining date
      // Use the same day of month as joining date
      const joiningDay = joiningDate.getDate()
      let dueDate = new Date(currentYear, currentMonth, joiningDay)

      // If the calculated due date is invalid (e.g., Feb 30), use the last day of the month
      const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
      if (joiningDay > lastDayOfMonth) {
        dueDate = new Date(currentYear, currentMonth, lastDayOfMonth)
      }

      // Create the current month fee
      await prisma.fee.create({
        data: {
          studentId: enrollment.studentId,
          enrollmentId: enrollment.id,
          amount: course.baseFee,
          finalAmount: course.baseFee, // No discount applied yet
          dueDate: dueDate,
          cycleDate: cycleDate,
          status: 'UNPAID'
        }
      })

      console.log(`✅ Created fee for ${enrollment.student.name} - Month ${monthNumber} - Due: ${dueDate.toISOString().split('T')[0]}`)
      feesCreated++
    }

    console.log(`🎉 Daily Cron Job Completed: ${feesCreated} fees created, ${feesSkipped} fees already existed`)

    return NextResponse.json({
      success: true,
      message: `Daily fee check completed. Created ${feesCreated} fees, ${feesSkipped} fees already existed.`,
      data: {
        cycleDate: cycleDate.toISOString().split('T')[0],
        feesCreated,
        feesSkipped
      }
    })

  } catch (error) {
    console.error('❌ Daily cron job failed:', error)
    return NextResponse.json({
      success: false,
      error: "Daily cron job failed",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}