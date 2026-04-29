-- AlterTable
ALTER TABLE "FeeReminderLog" ADD COLUMN     "week" TEXT;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "smsReminderEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "FeeReminderLog_studentId_week_idx" ON "FeeReminderLog"("studentId", "week");
