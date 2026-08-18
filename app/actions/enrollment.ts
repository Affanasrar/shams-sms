// app/actions/enrollment.ts
'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getCurrentFeeForCourse, getFeeForStudent } from '@/lib/course-fees'
import { generateFeeVoucherPdfBuffer } from '@/lib/pdf-helpers'
import { sendSmartMessage, sendSmartDocument } from '@/lib/messaging'
import { logAudit } from '@/lib/audit'

function getErrorMessage(error: unknown): string {
 if (error instanceof Error) return error.message
 if (typeof error === 'string') return error
 return String(error ?? 'Unknown error')
}

// Note: This function is likely called by your Server Action wrapper, or needs to be adapted to receive (prevState, formData) if used directly in useActionState.
// Assuming this is the helper function called by the server action:

export async function enrollStudent(studentId: string, courseOnSlotId: string) {
 console.log(`⚡ Attempting to enroll Student ${studentId} into Slot Assignment ${courseOnSlotId}`)

 // Start a transaction to ensure data integrity
 const newEnrollment = await prisma.$transaction(async (tx) => {
 // 1. Get the Target Slot and its Room Capacity
 const targetAssignment = await tx.courseOnSlot.findUnique({
 where: { id: courseOnSlotId },
 include: {
 slot: {
 include: { room: true }
 },
 course: true
 }
 })

 if (!targetAssignment) {
 throw new Error('Invalid Course/Slot selection')
 }

 const slotId = targetAssignment.slotId
 const roomName = targetAssignment.slot.room.name
 const roomCapacity = targetAssignment.slot.room.capacity
 const courseDuration = targetAssignment.course.durationMonths
 const courseFee = await getCurrentFeeForCourse(targetAssignment.courseId)

 // 2. Count Total Occupancy in this Slot (both ACTIVE and PENDING_COMPLETION occupy physical seats)
 const currentOccupancy = await tx.enrollment.count({
 where: {
 courseOnSlot: {
 slotId: slotId
 },
 status: { in: ['ACTIVE', 'PENDING_COMPLETION'] }
 }
 })

 console.log(`🧐 Capacity Check for ${roomName}: ${currentOccupancy}/${roomCapacity} occupied.`)

 // 3. The Guard Clause
 if (currentOccupancy >= roomCapacity) {
 throw new Error(
 `Selected course slot is full. ${roomName} has reached its capacity of ${roomCapacity} students.`
 )
 }

 // 4. Calculate End Date
 const today = new Date()
 const endDate = new Date(today)
 endDate.setMonth(endDate.getMonth() + courseDuration)

 // 5. Create the Enrollment
 const newEnrollment = await tx.enrollment.create({
 data: {
 studentId: studentId,
 courseOnSlotId: courseOnSlotId,
 joiningDate: today,
 endDate: endDate,
 status: 'ACTIVE'
 }
 })

 // 6. Generate the first invoice immediately
 const cycleDate = new Date(today.getFullYear(), today.getMonth(), 1)

 await tx.fee.create({
 data: {
 studentId: studentId,
 enrollmentId: newEnrollment.id,
 amount: courseFee,
 discountAmount: 0,
 finalAmount: courseFee,
 rolloverAmount: 0,
 dueDate: today,
 cycleDate: cycleDate,
 status: 'UNPAID'
 }
 })

 console.log('✅ Success! Enrolled & Billed.')
 return newEnrollment
 })

 const student = await prisma.student.findUnique({
 where: { id: studentId },
 select: {
 id: true,
 name: true,
 fatherName: true,
 phone: true,
 studentId: true
 }
 })

 // Fetch enrollment with course, slot, and initial fee details for PDF Fee Voucher + Welcome Packet
 const enrollmentWithDetails = await prisma.enrollment.findUnique({
 where: { id: newEnrollment.id },
 include: {
 courseOnSlot: {
 include: {
 course: true,
 slot: {
 include: {
 room: true
 }
 }
 }
 },
 fees: {
 orderBy: { dueDate: 'desc' },
 take: 1
 }
 }
 })

 if (student?.phone && enrollmentWithDetails) {
 const course = enrollmentWithDetails.courseOnSlot.course
 const slot = enrollmentWithDetails.courseOnSlot.slot
 const roomName = slot.room?.name || 'Classroom'
 const firstFee = enrollmentWithDetails.fees[0]
 
 // Format time in Pakistan timezone
 const startTime = new Date(slot.startTime).toLocaleTimeString('en-PK', {
 hour: '2-digit',
 minute: '2-digit',
 hour12: true,
 timeZone: 'Asia/Karachi'
 })
 const endTime = new Date(slot.endTime).toLocaleTimeString('en-PK', {
 hour: '2-digit',
 minute: '2-digit',
 hour12: true,
 timeZone: 'Asia/Karachi'
 })
 const joiningDateStr = new Date(enrollmentWithDetails.joiningDate).toLocaleDateString('en-PK', {
 year: 'numeric',
 month: 'short',
 day: 'numeric',
 timeZone: 'Asia/Karachi'
 })

 const welcomePacketCaption = `🎉 *WELCOME TO SHAMS COMMERCIAL INSTITUTE!*\n\nDear *${student.name}* (${student.studentId}),\nCongratulations on your admission! Your admission fee voucher is attached.\n\n📚 *Course:* ${course.name}\n⏰ *Class Timing:* ${startTime} - ${endTime} (${slot.days})\n📍 *Classroom:* ${roomName}\n📅 *Joining Date:* ${joiningDateStr}\n\n----------------------------------------\n📜 *INSTITUTE RULES & REGULATIONS:*\n1. 🎓 *Attendance:* Minimum 75% attendance is required for course completion & certificate.\n2. ⏰ *Punctuality:* Classes start on time. Late entry beyond 10 mins is strictly prohibited.\n3. 📱 *Mobile Phones:* Must be kept on silent mode during lectures and lab sessions.\n4. 💳 *Fee Due Date:* Monthly fees must be cleared on or before your specified due date.\n5. 💻 *Lab Protocol:* Computer equipment must be handled with care.\n\nWe wish you a successful learning journey!\n- Management, Shams Commercial Institute`

 let msgResponse

 if (firstFee) {
 try {
 const cycleMonth = new Date(firstFee.cycleDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'Asia/Karachi' })
 const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Karachi' })
 const dueDateStr = new Date(firstFee.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Karachi' })

 const pdfBuffer = await generateFeeVoucherPdfBuffer({
 voucherNo: `VCH-${firstFee.id.slice(0, 8).toUpperCase()}`,
 issueDate: todayStr,
 dueDate: dueDateStr,
 cycleMonth: cycleMonth,
 student: {
 studentId: student.studentId,
 name: student.name,
 fatherName: student.fatherName || 'N/A',
 phone: student.phone,
 },
 course: {
 name: course.name,
 timing: `${slot.days} (${startTime} - ${endTime})`,
 room: roomName,
 },
 financials: {
 baseAmount: Number(firstFee.amount),
 discountAmount: Number(firstFee.discountAmount || 0),
 rolloverAmount: Number(firstFee.rolloverAmount || 0),
 finalAmount: Number(firstFee.finalAmount),
 paidAmount: Number(firstFee.paidAmount),
 remainingAmount: Number(firstFee.finalAmount) - Number(firstFee.paidAmount),
 },
 institution: {
 name: 'Shams Commercial Institute',
 address: 'Main Campus, Commercial Area',
 phone: '+92 300 1234567',
 },
 })

 const fileName = `Admission_Fee_Voucher_${student.studentId}.pdf`

 // Send PDF Voucher + Welcome Packet Caption via WhatsApp / SMS fallback
 msgResponse = await sendSmartDocument(student.phone, pdfBuffer, fileName, welcomePacketCaption)
 } catch (pdfErr) {
 console.error('Admission PDF voucher generation error:', pdfErr)
 msgResponse = await sendSmartMessage(student.phone, welcomePacketCaption, 'SMART')
 }
 } else {
 msgResponse = await sendSmartMessage(student.phone, welcomePacketCaption, 'SMART')
 }

 await prisma.smsMessage.create({
 data: {
 studentId: student.id,
 phoneNumber: student.phone,
 message: `[Admission PDF Voucher & Welcome Packet] ${welcomePacketCaption}`,
 direction: 'OUTBOUND',
 status: msgResponse.success ? 'SENT' : 'FAILED',
 textbeeId: msgResponse.id || null,
 errorMsg: msgResponse.error || null,
 sentAt: msgResponse.success ? new Date() : null
 }
 })
 }

 // Audit log
 await logAudit({
 action: 'ENROLLMENT_CREATED',
 entity: 'Enrollment',
 entityId: newEnrollment.id,
 details: {
 studentName: student?.name,
 courseName: enrollmentWithDetails?.courseOnSlot?.course?.name,
 },
 })

 revalidatePath('/admin/enrollment')
 revalidatePath(`/admin/students/${studentId}`)
 revalidatePath('/admin/enrollment/new')

 return newEnrollment
}

// ------------------------------------------------------------------
// 👇 ADD THIS WRAPPER if you are using 'useActionState' in the Form
// ------------------------------------------------------------------
export async function createEnrollment(prevState: unknown, formData: FormData) {
 const studentId = formData.get('studentId') as string
 const courseOnSlotId = formData.get('courseOnSlotId') as string

 if (!studentId || !courseOnSlotId) {
 return { success: false, error: "Missing fields" }
 }

 try {
 await enrollStudent(studentId, courseOnSlotId)
 // Redirect happens here to refresh page
 revalidatePath(`/admin/students/${studentId}`)
 return { success: true, message: "Enrolled successfully!" }
 } catch (error: unknown) {
 return { success: false, error: getErrorMessage(error) || 'Enrollment failed' }
 }
}

export async function updateEnrollment(prevState: unknown, formData: FormData) {
 const enrollmentId = formData.get('enrollmentId') as string
 const courseOnSlotId = formData.get('courseOnSlotId') as string
 const joiningDateRaw = formData.get('joiningDate') as string

 if (!enrollmentId || !courseOnSlotId || !joiningDateRaw) {
 return { success: false, error: 'Missing required fields' }
 }

 const joiningDate = new Date(joiningDateRaw)
 if (Number.isNaN(joiningDate.getTime())) {
 return { success: false, error: 'Invalid enrollment date' }
 }

 try {
 // ─────────────────────────────────────────────────────────────────
 // PHASE 1 — Atomic writes only (kept short to avoid timeout)
 // ─────────────────────────────────────────────────────────────────
 const result = await prisma.$transaction(async (tx) => {
 const existingEnrollment = await tx.enrollment.findUnique({
 where: { id: enrollmentId },
 include: {
 courseOnSlot: {
 include: {
 course: true,
 slot: { include: { room: true } }
 }
 },
 student: true
 }
 })

 if (!existingEnrollment) {
 throw new Error('Enrollment not found')
 }

 if (existingEnrollment.status !== 'ACTIVE') {
 throw new Error('Only active enrollments can be edited')
 }

 const newCourseOnSlot = await tx.courseOnSlot.findUnique({
 where: { id: courseOnSlotId },
 include: {
 course: true,
 slot: { include: { room: true } }
 }
 })

 if (!newCourseOnSlot) {
 throw new Error('Invalid course selection')
 }

 // Capacity check if changing slot
 if (newCourseOnSlot.id !== existingEnrollment.courseOnSlotId) {
 const occupied = await tx.enrollment.count({
 where: {
 courseOnSlot: { slotId: newCourseOnSlot.slotId },
 status: 'ACTIVE'
 }
 })
 if (occupied >= newCourseOnSlot.slot.room.capacity) {
 throw new Error('Selected course slot is full. Please choose another one.')
 }
 }

 // Recalculate end date
 const durationMonths = newCourseOnSlot.course.durationMonths || 0
 const newEndDate = new Date(joiningDate)
 newEndDate.setMonth(newEndDate.getMonth() + durationMonths)
 if (existingEnrollment.extendedDays) {
 newEndDate.setDate(newEndDate.getDate() + existingEnrollment.extendedDays)
 }

 // Update the enrollment
 const updatedEnrollment = await tx.enrollment.update({
 where: { id: enrollmentId },
 data: { courseOnSlotId, joiningDate, endDate: newEndDate }
 })

 const now = new Date()
 // Cap at the PREVIOUS completed month — the current month's fee is the
 // cron job's responsibility, not the edit action's.
 const lastCompletedCycle = new Date(now.getFullYear(), now.getMonth() - 1, 1)
 const joiningCycle = new Date(joiningDate.getFullYear(), joiningDate.getMonth(), 1)

 // Remove pre-joining unpaid fees (zero-paid only — never touch partially paid)
 await tx.fee.deleteMany({
 where: {
 enrollmentId,
 status: 'UNPAID',
 paidAmount: 0,
 cycleDate: { lt: joiningCycle }
 }
 })

 // Create missing monthly fee records (only for MONTHLY courses)
 if (newCourseOnSlot.course.feeType === 'MONTHLY') {
 const maxCycle = new Date(joiningDate.getFullYear(), joiningDate.getMonth() + (newCourseOnSlot.course.durationMonths || 12) - 1, 1)
 const targetLastCycle = lastCompletedCycle < maxCycle ? lastCompletedCycle : maxCycle

 // Determine fee rate at time of joining
 const relevantFeeHistory = await tx.courseFeeHistory.findFirst({
 where: { courseId: newCourseOnSlot.courseId, changedAt: { lte: joiningDate } },
 orderBy: { changedAt: 'desc' }
 })
 let studentFeeRate = Number(newCourseOnSlot.course.baseFee)
 if (relevantFeeHistory) {
 studentFeeRate = Number(relevantFeeHistory.newFee)
 } else {
 const firstChange = await tx.courseFeeHistory.findFirst({
 where: { courseId: newCourseOnSlot.courseId },
 orderBy: { changedAt: 'asc' }
 })
 if (firstChange) studentFeeRate = Number(firstChange.oldFee)
 }

 const discounts = await tx.studentDiscount.findMany({ where: { enrollmentId } })

 // Fetch all existing cycleDates for this enrollment in one query.
 // Use a timezone-safe "YYYY-MM" key to avoid UTC offset mismatches
 // (local midnight != UTC midnight in timezones like UTC+5).
 const existingCycles = await tx.fee.findMany({
 where: { enrollmentId },
 select: { cycleDate: true }
 })
 const toYearMonth = (d: Date) =>
 `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
 const existingCycleSet = new Set(
 existingCycles.map((f) => toYearMonth(f.cycleDate))
 )

 const dueDay = joiningDate.getDate()
 const feesToCreate: Parameters<typeof tx.fee.create>[0]['data'][] = []

 let cursorCycle = new Date(joiningCycle)
 let monthsDiff = 0
 while (cursorCycle <= targetLastCycle) {
 const year = cursorCycle.getFullYear()
 const month = cursorCycle.getMonth()
 // Store cycleDate as UTC midnight to match how the cron job stores it
 const cycleDate = new Date(Date.UTC(year, month, 1))
 const cycleKey = `${year}-${String(month + 1).padStart(2, '0')}`

 if (!existingCycleSet.has(cycleKey)) {
 const monthNumber = monthsDiff + 1
 const activeDiscounts = discounts.filter(
 (d) =>
 d.applicableFromMonth <= monthNumber &&
 (d.applicableToMonth === null || d.applicableToMonth >= monthNumber)
 )
 let discountAmount = 0
 if (activeDiscounts.length > 0) {
 const discount = activeDiscounts[0]
 if (discount.discountType === 'FIXED') {
 discountAmount = Number(discount.discountAmount)
 } else if (discount.discountType === 'PERCENTAGE') {
 discountAmount = studentFeeRate * (Number(discount.discountAmount) / 100)
 }
 }
 const baseAmount = Math.max(0, studentFeeRate - discountAmount)
 const lastDayOfMonth = new Date(cycleDate.getFullYear(), cycleDate.getMonth() + 1, 0).getDate()
 const dueDate = new Date(cycleDate.getFullYear(), cycleDate.getMonth(), Math.min(dueDay, lastDayOfMonth))

 feesToCreate.push({
 studentId: existingEnrollment.studentId,
 enrollmentId,
 amount: studentFeeRate,
 discountAmount,
 finalAmount: baseAmount,
 rolloverAmount: 0,
 dueDate,
 cycleDate,
 status: 'UNPAID'
 })
 }

 cursorCycle.setMonth(cursorCycle.getMonth() + 1)
 monthsDiff++
 }

 // Batch-create all missing fees
 if (feesToCreate.length > 0) {
 await tx.fee.createMany({ data: feesToCreate as never[] })
 }
 }

 return {
 enrollment: updatedEnrollment,
 studentId: existingEnrollment.studentId
 }
 }, { timeout: 15000 }) // 15s safety net for the remaining queries

 // ─────────────────────────────────────────────────────────────────
 // PHASE 2 — Post-transaction: due date alignment + rollover recalc
 // These are best-effort updates; if they fail the enrollment is
 // still saved. They run outside the transaction to avoid timeouts.
 // ─────────────────────────────────────────────────────────────────
 const dueDay = joiningDate.getDate()

 // Update due dates for UNPAID/PARTIAL fees in bulk using DB expression
 // We can't do per-row math in updateMany, so fetch once and update in parallel
 const unpaidFees = await prisma.fee.findMany({
 where: { enrollmentId, status: { in: ['UNPAID', 'PARTIAL'] } },
 select: { id: true, cycleDate: true }
 })

 if (unpaidFees.length > 0) {
 await Promise.all(
 unpaidFees.map((fee) => {
 const lastDayOfMonth = new Date(fee.cycleDate.getFullYear(), fee.cycleDate.getMonth() + 1, 0).getDate()
 const newDueDate = new Date(fee.cycleDate.getFullYear(), fee.cycleDate.getMonth(), Math.min(dueDay, lastDayOfMonth))
 return prisma.fee.update({ where: { id: fee.id }, data: { dueDate: newDueDate } })
 })
 )
 }

 // Rollover recalculation (sequential by design — preserves chronological order)
 const allFees = await prisma.fee.findMany({
 where: { enrollmentId },
 orderBy: { cycleDate: 'asc' },
 select: { id: true, amount: true, discountAmount: true, paidAmount: true, rolloverAmount: true, finalAmount: true }
 })

 let cumulativeUnpaid = 0
 const rolloverUpdates: Promise<unknown>[] = []
 for (const fee of allFees) {
 const base = Math.max(0, Number(fee.amount) - Number(fee.discountAmount))
 const prevBalance = cumulativeUnpaid
 if (Number(fee.rolloverAmount) !== prevBalance || Number(fee.finalAmount) !== base) {
 rolloverUpdates.push(
 prisma.fee.update({
 where: { id: fee.id },
 data: { rolloverAmount: prevBalance, finalAmount: base }
 })
 )
 }
 cumulativeUnpaid = Math.max(0, base - Number(fee.paidAmount))
 }
 if (rolloverUpdates.length > 0) {
 await Promise.all(rolloverUpdates)
 }

 revalidatePath('/admin/enrollment')
 revalidatePath(`/admin/students/${result.studentId}`)
 revalidatePath('/admin/fees')

 return { success: true, message: 'Enrollment updated successfully' }
 } catch (error: unknown) {
 console.error('Update Enrollment Error:', getErrorMessage(error))
 return { success: false, error: getErrorMessage(error) || 'Failed to update enrollment' }
 }
}



// Helper to fetch data (Keep this if you use it in page.tsx)
export async function getEnrollmentData() {
 const students = await prisma.student.findMany({ 
 orderBy: { name: 'asc' },
 select: { id: true, name: true, fatherName: true }
 })
 
 const assignments = await prisma.courseOnSlot.findMany({
 include: {
 course: true,
 slot: { include: { room: true } }
 }
 })

 return { students, assignments }
}

export async function dropStudent(formData: FormData) {
 const enrollmentId = formData.get('enrollmentId') as string
 const refund = formData.get('refund') === 'true'

 if (!enrollmentId) return

 try {
 // Get enrollment details to find the student
 const enrollment = await prisma.enrollment.findUnique({
 where: { id: enrollmentId },
 select: {
 studentId: true,
 student: { select: { name: true } },
 courseOnSlot: { select: { course: { select: { name: true } } } }
 }
 })

 if (!enrollment) {
 return { success: false, error: "Enrollment not found" }
 }

 // Only delete fees if user chose to refund
 if (refund) {
 await prisma.fee.deleteMany({
 where: {
 enrollmentId: enrollmentId,
 status: { not: 'PAID' }
 }
 })
 }

 // Mark enrollment as DROPPED and set endDate to today
 await prisma.enrollment.update({
 where: { id: enrollmentId },
 data: { 
 status: 'DROPPED',
 endDate: new Date()
 }
 })

 // Audit log
 await logAudit({
 action: 'ENROLLMENT_DROPPED',
 entity: 'Enrollment',
 entityId: enrollmentId,
 details: {
 studentName: enrollment.student?.name,
 courseName: enrollment.courseOnSlot?.course?.name,
 studentId: enrollment.studentId,
 refund,
 },
 })


 // Refresh the relevant pages
 revalidatePath('/admin/enrollment')
 revalidatePath('/admin')
 revalidatePath(`/admin/students/${enrollment.studentId}`)
 
 return { 
 success: true, 
 message: refund 
 ? "Student dropped and fees refunded" 
 : "Student dropped (fees kept)"
 }
 } catch (error) {
 console.error("Drop Error:", error)
 return { success: false, error: "Failed to drop student" }
 }
}

export async function restoreEnrollment(formData: FormData) {
 const enrollmentId = formData.get('enrollmentId') as string

 if (!enrollmentId) return { success: false, error: 'Missing enrollment ID' }

 try {
 // Get enrollment details including course info
 const enrollment = await prisma.enrollment.findUnique({
 where: { id: enrollmentId },
 include: {
 courseOnSlot: { include: { course: true } },
 student: true
 }
 })

 if (!enrollment) {
 return { success: false, error: "Enrollment not found" }
 }

 // Check if fees exist for the current month
 const now = new Date()
 const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
 const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

 const existingFee = await prisma.fee.findFirst({
 where: {
 enrollmentId: enrollmentId, // ✅ Check THIS enrollment specifically, not the student's other enrollments
 cycleDate: {
 gte: currentMonthStart,
 lte: currentMonthEnd
 }
 }
 })

 // Restore the enrollment
 await prisma.enrollment.update({
 where: { id: enrollmentId },
 data: {
 status: 'ACTIVE',
 endDate: null
 }
 })

 // Only create a new fee if fees were refunded (i.e., don't exist)
 if (!existingFee) {
 // ✅ Use the student's historical fee rate (respects CourseFeeHistory)
 // NOT baseFee which would charge the new rate after an editCourse
 const studentFee = await getFeeForStudent(enrollmentId)
 await prisma.fee.create({
 data: {
 studentId: enrollment.studentId,
 enrollmentId: enrollmentId,
 amount: studentFee,
 discountAmount: 0,
 finalAmount: studentFee,
 rolloverAmount: 0,
 dueDate: now,
 cycleDate: currentMonthStart,
 status: 'UNPAID'
 }
 })
 }

 revalidatePath('/admin/enrollment')
 revalidatePath('/admin')
 revalidatePath(`/admin/students/${enrollment.studentId}`)

 const message = existingFee
 ? "Enrollment restored (fees were not refunded, original balance remains)"
 : "Enrollment restored and new fees created"

 return { success: true, message }
 } catch (error) {
 console.error("Restore Error:", error)
 return { success: false, error: "Failed to restore enrollment" }
 }
}

export async function extendCourse(prevState: unknown, formData: FormData) {
 const enrollmentId = formData.get('enrollmentId') as string
 const additionalDays = parseInt(formData.get('additionalDays') as string)

 if (!enrollmentId || !additionalDays || additionalDays <= 0) {
 return { success: false, error: "Invalid enrollment ID or days" }
 }

 try {
 // Get current enrollment to calculate new end date
 const enrollment = await prisma.enrollment.findUnique({
 where: { id: enrollmentId },
 include: { courseOnSlot: { include: { course: true } } }
 })

 if (!enrollment) {
 return { success: false, error: "Enrollment not found" }
 }

 // Calculate new end date: current end date + additional days
 const currentEndDate = enrollment.endDate || new Date(
 enrollment.joiningDate.getTime() + 
 (enrollment.courseOnSlot.course.durationMonths * 30 * 24 * 60 * 60 * 1000) +
 ((enrollment.extendedDays || 0) * 24 * 60 * 60 * 1000)
 )
 
 const newEndDate = new Date(currentEndDate.getTime() + (additionalDays * 24 * 60 * 60 * 1000))

 // Update enrollment with new extended days and end date
 await prisma.enrollment.update({
 where: { id: enrollmentId },
 data: { 
 extendedDays: (enrollment.extendedDays || 0) + additionalDays,
 endDate: newEndDate
 }
 })

 // Check and create fee records for the extended period
 // Determine the monthly cycles covered up to the newEndDate
 const feeRate = await getFeeForStudent(enrollmentId)
 const joiningDate = new Date(enrollment.joiningDate)
 const dueDay = joiningDate.getDate()
 const joiningCycle = new Date(joiningDate.getFullYear(), joiningDate.getMonth(), 1)

 let cursorDate = new Date(currentEndDate.getFullYear(), currentEndDate.getMonth(), 1)
 const lastCycleDate = new Date(newEndDate.getFullYear(), newEndDate.getMonth(), 1)

 let createdFeesCount = 0
 const discounts = await prisma.studentDiscount.findMany({ where: { enrollmentId } })

 while (cursorDate <= lastCycleDate) {
 const cycleDate = new Date(cursorDate.getFullYear(), cursorDate.getMonth(), 1)

 const existingFee = await prisma.fee.findFirst({
 where: {
 enrollmentId,
 cycleDate,
 }
 })

 if (!existingFee) {
 let monthsDiff = (cycleDate.getFullYear() - joiningCycle.getFullYear()) * 12 + (cycleDate.getMonth() - joiningCycle.getMonth())
 const monthNumber = monthsDiff + 1

 const activeDiscounts = discounts.filter(
 (d) =>
 d.applicableFromMonth <= monthNumber &&
 (d.applicableToMonth === null || d.applicableToMonth >= monthNumber)
 )
 let discountAmount = 0
 if (activeDiscounts.length > 0) {
 const discount = activeDiscounts[0]
 if (discount.discountType === 'FIXED') {
 discountAmount = Number(discount.discountAmount)
 } else if (discount.discountType === 'PERCENTAGE') {
 discountAmount = feeRate * (Number(discount.discountAmount) / 100)
 }
 }
 const baseAmount = Math.max(0, feeRate - discountAmount)

 const lastDayOfMonth = new Date(cycleDate.getFullYear(), cycleDate.getMonth() + 1, 0).getDate()
 const dueDate = new Date(
 cycleDate.getFullYear(),
 cycleDate.getMonth(),
 Math.min(dueDay, lastDayOfMonth)
 )

 await prisma.fee.create({
 data: {
 studentId: enrollment.studentId,
 enrollmentId,
 amount: feeRate,
 discountAmount,
 finalAmount: baseAmount,
 rolloverAmount: 0,
 dueDate,
 cycleDate,
 status: 'UNPAID'
 }
 })
 createdFeesCount++
 }

 // Move to next month
 cursorDate.setMonth(cursorDate.getMonth() + 1)
 }

 // Audit log
 const student = await prisma.student.findUnique({
 where: { id: enrollment.studentId },
 select: { name: true }
 })

 await logAudit({
 action: 'ENROLLMENT_EXTENDED',
 entity: 'Enrollment',
 entityId: enrollmentId,
 details: {
 studentName: student?.name,
 courseName: enrollment.courseOnSlot.course.name,
 additionalDays,
 newEndDate: newEndDate.toISOString(),
 createdFeesCount
 }
 })

 // Refresh the student profile page & related views
 revalidatePath(`/admin/students/${enrollment.studentId}`)
 revalidatePath('/admin/fees')
 revalidatePath('/admin/enrollment')

 const feeMsg = createdFeesCount > 0 ? ` and ${createdFeesCount} fee record(s) created` : ''
 return { success: true, message: `Course extended by ${additionalDays} days${feeMsg}.` }
 } catch (error) {
 console.error("Extend Course Error:", error)
 return { success: false, error: "Failed to extend course" }
 }
}

/**
 * Change student's course timing (slot) without affecting:
 * - Course start date (joiningDate)
 * - Course end date (endDate)
 * - Fees and other enrollment details
 */
export async function changeEnrollmentTiming(
 enrollmentId: string,
 newCourseOnSlotId: string
) {
 try {
 console.log(`⚡ Attempting to change timing for Enrollment ${enrollmentId} to Slot ${newCourseOnSlotId}`)

 return await prisma.$transaction(async (tx) => {
 // 1. Get current enrollment details
 const currentEnrollment = await tx.enrollment.findUnique({
 where: { id: enrollmentId },
 include: {
 courseOnSlot: {
 include: { course: true, slot: { include: { room: true } } }
 },
 student: true
 }
 })

 if (!currentEnrollment) {
 throw new Error("Enrollment not found")
 }

 // 2. Verify student is still active in current course
 if (currentEnrollment.status !== 'ACTIVE') {
 throw new Error("Can only change timing for active enrollments")
 }

 // 3. Get the new slot assignment details
 const newCourseOnSlot = await tx.courseOnSlot.findUnique({
 where: { id: newCourseOnSlotId },
 include: {
 course: true,
 slot: { include: { room: true } }
 }
 })

 if (!newCourseOnSlot) {
 throw new Error("Invalid new slot selection")
 }

 // 4. Verify it's the same course (same course name)
 if (currentEnrollment.courseOnSlot.course.id !== newCourseOnSlot.course.id) {
 throw new Error("Can only change timing within the same course")
 }

 // 5. Check capacity in the new slot (both ACTIVE and PENDING_COMPLETION occupy physical seats)
 const currentOccupancy = await tx.enrollment.count({
   where: {
     courseOnSlot: {
       slotId: newCourseOnSlot.slotId
     },
     status: { in: ['ACTIVE', 'PENDING_COMPLETION'] }
   }
 })

 const newRoomCapacity = newCourseOnSlot.slot.room.capacity

 if (currentOccupancy >= newRoomCapacity) {
 throw new Error(
 `New timing slot is full (${currentOccupancy}/${newRoomCapacity} seats occupied). Please choose a different timing.`
 )
 }

 // 6. Update the enrollment with new courseOnSlotId
 // All other fields (joiningDate, endDate, status, extendedDays) remain unchanged
 const updatedEnrollment = await tx.enrollment.update({
 where: { id: enrollmentId },
 data: {
 courseOnSlotId: newCourseOnSlotId
 },
 include: {
 courseOnSlot: {
 include: { slot: { include: { room: true } }, course: true }
 }
 }
 })

 console.log(
 `✅ Timing changed for ${currentEnrollment.student.name}: ${currentEnrollment.courseOnSlot.slot.days} → ${updatedEnrollment.courseOnSlot.slot.days}`
 )

 // Revalidate relevant pages
 revalidatePath(`/admin/students/${currentEnrollment.studentId}`)
 revalidatePath(`/admin/schedule`)

 return {
 success: true,
 message: `Timing changed successfully from ${currentEnrollment.courseOnSlot.slot.days} to ${updatedEnrollment.courseOnSlot.slot.days}`,
 enrollment: {
 id: updatedEnrollment.id,
 courseName: updatedEnrollment.courseOnSlot.course.name,
 days: updatedEnrollment.courseOnSlot.slot.days,
 room: updatedEnrollment.courseOnSlot.slot.room.name,
 joiningDate: updatedEnrollment.joiningDate,
 endDate: updatedEnrollment.endDate
 }
 }
 })
 } catch (error) {
 console.error("Change Timing Error:", error)
 return {
 success: false,
 error: error instanceof Error ? error.message : "Failed to change course timing"
 }
 }
}