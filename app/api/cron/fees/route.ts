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
        student: true
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

      // ⭐ CRITICAL: Check if fee already exists for this cycle
      // Use exact cycleDate match for this enrollment
      const existingFee = await prisma.fee.findFirst({
        where: {
          enrollmentId: enrollment.id,
          cycleDate: cycleDate
        }
      })

      if (existingFee) {
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

      // ⭐ CRITICAL: Only process fees for the CURRENT MONTH
      // Prevent fees from being created for past or future months
      const expectedCycleMonth = new Date(joiningDate.getFullYear(), joiningDate.getMonth() + monthsDiff, 1)
      
      // Verify the calculated cycle date matches our current month processing
      if (expectedCycleMonth.getFullYear() !== currentYear || expectedCycleMonth.getMonth() !== currentMonth) {
        console.log(`⏭️ Skipped ${enrollment.student.name} - Not due this month (Month ${monthNumber} cycles in different month)`)
        feesSkipped++
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

      // ⭐ CRITICAL FIX: Only create fee if due date has already passed (or is today)
      // Set time to midnight for proper date comparison
      const nowAtMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const dueDateAtMidnight = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())
      
      // Don't create fees for future due dates
      if (dueDateAtMidnight > nowAtMidnight) {
        console.log(`⏩ Skipped ${enrollment.student.name} - Due date (${dueDate.toISOString().split('T')[0]}) is in the future`)
        feesSkipped++
        continue
      }

      // 🔄 Calculate rollover amount from ALL unpaid previous fees (cumulative)
      const unpaidPreviousFees = await prisma.fee.findMany({
        where: {
          enrollmentId: enrollment.id,
          cycleDate: {
            lt: cycleDate // Get all fees before the current month
          },
          status: { in: ['UNPAID', 'PARTIAL'] }
        }
      })

      let rolloverAmount = 0
      if (unpaidPreviousFees.length > 0) {
        // Calculate total unpaid balance from ALL previous months
        rolloverAmount = unpaidPreviousFees.reduce((sum, fee) => {
          const unpaidBalance = Number(fee.finalAmount) - Number(fee.paidAmount)
          return sum + Math.max(0, unpaidBalance)
        }, 0)
      }

      // 🎯 Check for active discounts that apply to this month
      const activeDiscounts = await prisma.studentDiscount.findMany({
        where: {
          enrollmentId: enrollment.id,
          applicableFromMonth: { lte: monthNumber },
          OR: [
            { applicableToMonth: { gte: monthNumber } },
            { applicableToMonth: null } // Include entire-course discounts
          ]
        }
      })

      // Calculate discount amount if any discount applies
      let discountAmount = 0
      let discountId: string | undefined
      
      if (activeDiscounts.length > 0) {
        const discount = activeDiscounts[0] // Use the first matching discount
        discountId = discount.id
        
        if (discount.discountType === 'FIXED') {
          discountAmount = Number(discount.discountAmount)
        } else if (discount.discountType === 'PERCENTAGE') {
          discountAmount = Number(course.baseFee) * (Number(discount.discountAmount) / 100)
        }
      }

      // Create the current month fee with rollover and discount applied
      const baseAmount = Number(course.baseFee) - discountAmount
      const totalAmount = baseAmount + rolloverAmount
      
      await prisma.fee.upsert({
        where: {
          enrollmentId_cycleDate: {
            enrollmentId: enrollment.id,
            cycleDate: cycleDate
          }
        },
        create: {
          studentId: enrollment.studentId,
          enrollmentId: enrollment.id,
          amount: course.baseFee,
          discountAmount: discountAmount,
          rolloverAmount: rolloverAmount, // Track previous month balance
          finalAmount: totalAmount, // Total = (current month - discount) + rollover
          dueDate: dueDate,
          cycleDate: cycleDate,
          status: 'UNPAID',
          discountId: discountId
        },
        update: {
          amount: course.baseFee,
          discountAmount: discountAmount,
          rolloverAmount: rolloverAmount,
          finalAmount: totalAmount,
          dueDate: dueDate,
          discountId: discountId
        }
      })

      const discountInfo = discountAmount > 0 ? ` (- PKR ${discountAmount} discount)` : ''
      const rolloverInfo = rolloverAmount > 0 ? ` (+ PKR ${rolloverAmount} rollover from previous month)` : ''
      console.log(`✅ Created fee for ${enrollment.student.name} - Month ${monthNumber} - Due: ${dueDate.toISOString().split('T')[0]} - Amount: PKR ${totalAmount}${discountInfo}${rolloverInfo}`)
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