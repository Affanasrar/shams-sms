-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'TEACHER');

-- CreateEnum
CREATE TYPE "FeeType" AS ENUM ('MONTHLY', 'PACKAGE');

-- CreateEnum
CREATE TYPE "EnrollStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'DROPPED');

-- CreateEnum
CREATE TYPE "FeeStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('FIXED', 'PERCENTAGE');

-- CreateEnum
CREATE TYPE "DiscountDuration" AS ENUM ('SINGLE_MONTH', 'ENTIRE_COURSE');

-- CreateEnum
CREATE TYPE "AttendStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'LEAVE');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('MONTHLY', 'STUDENT', 'COURSE', 'OVERALL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "role" "Role" NOT NULL DEFAULT 'TEACHER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "durationMonths" INTEGER NOT NULL,
    "baseFee" DECIMAL(65,30) NOT NULL,
    "feeType" "FeeType" NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Slot" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "days" TEXT NOT NULL,

    CONSTRAINT "Slot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseOnSlot" (
    "id" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "teacherId" TEXT,

    CONSTRAINT "CourseOnSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fatherName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT,
    "admission" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseOnSlotId" TEXT NOT NULL,
    "joiningDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "EnrollStatus" NOT NULL DEFAULT 'ACTIVE',
    "endDate" TIMESTAMP(3),
    "extendedDays" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fee" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "enrollmentId" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "discountAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "finalAmount" DECIMAL(65,30) NOT NULL,
    "paidAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "rolloverAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "FeeStatus" NOT NULL DEFAULT 'UNPAID',
    "cycleDate" TIMESTAMP(3) NOT NULL,
    "discountId" TEXT,

    CONSTRAINT "Fee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentDiscount" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "discountAmount" DECIMAL(65,30) NOT NULL,
    "discountType" "DiscountType" NOT NULL,
    "discountDuration" "DiscountDuration" NOT NULL,
    "applicableFromMonth" INTEGER NOT NULL,
    "applicableToMonth" INTEGER,
    "appliedToMonths" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentDiscount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "feeId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "collectedById" TEXT NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseOnSlotId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "AttendStatus" NOT NULL,
    "markedById" TEXT NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Result" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "marks" DECIMAL(65,30) NOT NULL,
    "total" DECIMAL(65,30) NOT NULL,
    "grade" TEXT,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportFormat" (
    "id" TEXT NOT NULL,
    "reportType" "ReportType" NOT NULL,
    "name" TEXT NOT NULL,
    "showLogo" BOOLEAN NOT NULL DEFAULT true,
    "logoPosition" TEXT NOT NULL DEFAULT 'top-left',
    "logoUrl" TEXT,
    "headerText" TEXT,
    "footerText" TEXT,
    "titleFontSize" INTEGER NOT NULL DEFAULT 24,
    "titleFontFamily" TEXT NOT NULL DEFAULT 'Helvetica-Bold',
    "subtitleFontSize" INTEGER NOT NULL DEFAULT 16,
    "subtitleFontFamily" TEXT NOT NULL DEFAULT 'Helvetica',
    "bodyFontSize" INTEGER NOT NULL DEFAULT 12,
    "bodyFontFamily" TEXT NOT NULL DEFAULT 'Helvetica',
    "primaryColor" TEXT NOT NULL DEFAULT '#1f2937',
    "secondaryColor" TEXT NOT NULL DEFAULT '#6b7280',
    "accentColor" TEXT NOT NULL DEFAULT '#3b82f6',
    "backgroundColor" TEXT NOT NULL DEFAULT '#ffffff',
    "pageOrientation" TEXT NOT NULL DEFAULT 'portrait',
    "pageSize" TEXT NOT NULL DEFAULT 'A4',
    "marginTop" INTEGER NOT NULL DEFAULT 50,
    "marginBottom" INTEGER NOT NULL DEFAULT 50,
    "marginLeft" INTEGER NOT NULL DEFAULT 50,
    "marginRight" INTEGER NOT NULL DEFAULT 50,
    "showGeneratedDate" BOOLEAN NOT NULL DEFAULT true,
    "showPageNumbers" BOOLEAN NOT NULL DEFAULT true,
    "showInstitutionInfo" BOOLEAN NOT NULL DEFAULT true,
    "institutionName" TEXT NOT NULL DEFAULT 'Shams Computer Institute',
    "institutionAddress" TEXT,
    "institutionPhone" TEXT,
    "institutionEmail" TEXT,
    "monthlyShowStudentDetails" BOOLEAN NOT NULL DEFAULT true,
    "monthlyShowPaymentHistory" BOOLEAN NOT NULL DEFAULT true,
    "studentShowFeeBreakdown" BOOLEAN NOT NULL DEFAULT true,
    "studentShowPaymentTimeline" BOOLEAN NOT NULL DEFAULT true,
    "courseShowStudentList" BOOLEAN NOT NULL DEFAULT true,
    "overallShowCharts" BOOLEAN NOT NULL DEFAULT false,
    "overallShowMonthlyTrends" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportFormat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Student_studentId_key" ON "Student"("studentId");

-- CreateIndex
CREATE INDEX "Fee_status_dueDate_idx" ON "Fee"("status", "dueDate");

-- CreateIndex
CREATE INDEX "StudentDiscount_studentId_enrollmentId_idx" ON "StudentDiscount"("studentId", "enrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_studentId_courseOnSlotId_date_key" ON "Attendance"("studentId", "courseOnSlotId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ReportFormat_reportType_key" ON "ReportFormat"("reportType");

-- AddForeignKey
ALTER TABLE "Slot" ADD CONSTRAINT "Slot_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseOnSlot" ADD CONSTRAINT "CourseOnSlot_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "Slot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseOnSlot" ADD CONSTRAINT "CourseOnSlot_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseOnSlot" ADD CONSTRAINT "CourseOnSlot_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_courseOnSlotId_fkey" FOREIGN KEY ("courseOnSlotId") REFERENCES "CourseOnSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fee" ADD CONSTRAINT "Fee_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fee" ADD CONSTRAINT "Fee_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fee" ADD CONSTRAINT "Fee_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "StudentDiscount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentDiscount" ADD CONSTRAINT "StudentDiscount_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentDiscount" ADD CONSTRAINT "StudentDiscount_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_feeId_fkey" FOREIGN KEY ("feeId") REFERENCES "Fee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_collectedById_fkey" FOREIGN KEY ("collectedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_courseOnSlotId_fkey" FOREIGN KEY ("courseOnSlotId") REFERENCES "CourseOnSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_markedById_fkey" FOREIGN KEY ("markedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
