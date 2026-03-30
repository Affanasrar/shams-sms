-- CreateTable
CREATE TABLE "CourseFeeHistory" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "oldFee" DECIMAL(65,30) NOT NULL,
    "newFee" DECIMAL(65,30) NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedById" TEXT NOT NULL,

    CONSTRAINT "CourseFeeHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CourseFeeHistory_courseId_changedAt_idx" ON "CourseFeeHistory"("courseId", "changedAt");

-- AddForeignKey
ALTER TABLE "CourseFeeHistory" ADD CONSTRAINT "CourseFeeHistory_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseFeeHistory" ADD CONSTRAINT "CourseFeeHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
