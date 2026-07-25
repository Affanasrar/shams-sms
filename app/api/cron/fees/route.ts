// app/api/cron/fees/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getFeeForStudent } from '@/lib/course-fees'

// Function name must be GET (uppercase)
export async function GET(request: NextRequest) {
  // 🔒 Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn('⚠️ Unauthorized cron job access attempt on /api/cron/fees')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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

    // 🚀 BATCH FETCH: Pre-load all data needed for the loop to eliminate N+1 queries
    // Instead of querying per-enrollment, we fetch everything in 3 bulk queries

    // 1. Batch fetch all existing fees for the current cycle date
    const existingFeesForCycle = await prisma.fee.findMany({
      where: {
        cycleDate: cycleDate,
        enrollmentId: { in: activeEnrollments.map(e => e.id) }
      },
      select: { enrollmentId: true }
    })
    const existingFeeSet = new Set(existingFeesForCycle.map(f => f.enrollmentId))

    // 2. Batch fetch all unpaid/partial fees from previous months (for rollover calculation)
    const allUnpaidPreviousFees = await prisma.fee.findMany({
      where: {
        enrollmentId: { in: activeEnrollments.map(e => e.id) },
        cycleDate: { lt: cycleDate },
        status: { in: ['UNPAID', 'PARTIAL'] }
      },
      select: {
        enrollmentId: true,
        finalAmount: true,
        paidAmount: true
      }
    })
    // Group unpaid fees by enrollmentId
    const unpaidFeesByEnrollment = new Map<string, typeof allUnpaidPreviousFees>()
    for (const fee of allUnpaidPreviousFees) {
      const existing = unpaidFeesByEnrollment.get(fee.enrollmentId!) || []
      existing.push(fee)
      unpaidFeesByEnrollment.set(fee.enrollmentId!, existing)
    }

    // 3. Batch fetch all active discounts
    const allDiscounts = await prisma.studentDiscount.findMany({
      where: {
        enrollmentId: { in: activeEnrollments.map(e => e.id) }
      }
    })
    // Group discounts by enrollmentId
    const discountsByEnrollment = new Map<string, typeof allDiscounts>()
    for (const discount of allDiscounts) {
      const existing = discountsByEnrollment.get(discount.enrollmentId) || []
      existing.push(discount)
      discountsByEnrollment.set(discount.enrollmentId, existing)
    }

    console.log(`📊 Pre-fetched: ${existingFeeSet.size} existing fees, ${allUnpaidPreviousFees.length} unpaid fees, ${allDiscounts.length} discounts`)

    let feesCreated = 0
    let feesSkipped = 0

    for (const enrollment of activeEnrollments) {
      const course = enrollment.courseOnSlot.course

      // Skip if not a monthly fee course
      if (course.feeType !== 'MONTHLY') {
        continue
      }

      // ⭐ CRITICAL: Check if fee already exists for this cycle (using pre-fetched Set)
      if (existingFeeSet.has(enrollment.id)) {
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
      const expectedCycleMonth = new Date(joiningDate.getFullYear(), joiningDate.getMonth() + monthsDiff, 1)
      
      if (expectedCycleMonth.getFullYear() !== currentYear || expectedCycleMonth.getMonth() !== currentMonth) {
        console.log(`⏭️ Skipped ${enrollment.student.name} - Not due this month (Month ${monthNumber} cycles in different month)`)
        feesSkipped++
        continue
      }

      // Calculate due date based on student's joining date
      const joiningDay = joiningDate.getDate()
      let dueDate = new Date(currentYear, currentMonth, joiningDay)

      const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
      if (joiningDay > lastDayOfMonth) {
        dueDate = new Date(currentYear, currentMonth, lastDayOfMonth)
      }

      // ⭐ CRITICAL FIX: Only create fee if due date has already passed (or is today)
      const nowAtMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const dueDateAtMidnight = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())
      
      if (dueDateAtMidnight > nowAtMidnight) {
        console.log(`⏩ Skipped ${enrollment.student.name} - Due date (${dueDate.toISOString().split('T')[0]}) is in the future`)
        feesSkipped++
        continue
      }

      // 🔄 Calculate rollover amount from pre-fetched unpaid fees
      const unpaidPreviousFees = unpaidFeesByEnrollment.get(enrollment.id) || []
      let rolloverAmount = 0
      if (unpaidPreviousFees.length > 0) {
        rolloverAmount = unpaidPreviousFees.reduce((sum, fee) => {
          const unpaidBalance = Number(fee.finalAmount) - Number(fee.paidAmount)
          return sum + Math.max(0, unpaidBalance)
        }, 0)
      }

      // Get the fee amount for this specific student based on their enrollment date
      // (This still queries individually since it depends on enrollment-specific fee history)
      const studentFee = await getFeeForStudent(enrollment.id)

      // 🎯 Check for active discounts from pre-fetched data
      const enrollmentDiscounts = discountsByEnrollment.get(enrollment.id) || []
      const activeDiscounts = enrollmentDiscounts.filter(d =>
        d.applicableFromMonth <= monthNumber &&
        (d.applicableToMonth === null || d.applicableToMonth >= monthNumber)
      )

      // Calculate discount amount if any discount applies
      let discountAmount = 0
      let discountId: string | undefined
      
      if (activeDiscounts.length > 0) {
        const discount = activeDiscounts[0]
        discountId = discount.id
        
        if (discount.discountType === 'FIXED') {
          discountAmount = Number(discount.discountAmount)
        } else if (discount.discountType === 'PERCENTAGE') {
          discountAmount = studentFee * (Number(discount.discountAmount) / 100)
        }
      }

      // Create the current month fee
      const baseAmount = studentFee - discountAmount
      
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
          amount: studentFee,
          discountAmount: discountAmount,
          rolloverAmount: rolloverAmount,
          finalAmount: baseAmount,
          dueDate: dueDate,
          cycleDate: cycleDate,
          status: 'UNPAID',
          discountId: discountId
        },
        update: {
          amount: studentFee,
          discountAmount: discountAmount,
          rolloverAmount: rolloverAmount,
          finalAmount: baseAmount,
          dueDate: dueDate,
          discountId: discountId
        }
      })

      const dueIsToday = dueDateAtMidnight.getTime() === nowAtMidnight.getTime()
      if (dueIsToday && enrollment.student.phone) {
        console.log(`📅 Fee due today for ${enrollment.student.name} (${enrollment.student.phone}) - Amount: PKR ${baseAmount}`)
      }

      const discountInfo = discountAmount > 0 ? ` (- PKR ${discountAmount} discount)` : ''
      const rolloverInfo = rolloverAmount > 0 ? ` (PKR ${rolloverAmount} outstanding from previous months)` : ''
      console.log(`✅ Created fee for ${enrollment.student.name} - Month ${monthNumber} - Due: ${dueDate.toISOString().split('T')[0]} - Amount: PKR ${baseAmount}${discountInfo}${rolloverInfo}`)
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