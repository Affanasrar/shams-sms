/*
  Warnings:

  - A unique constraint covering the columns `[enrollmentId,cycleDate]` on the table `Fee` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Fee_enrollmentId_cycleDate_key" ON "Fee"("enrollmentId", "cycleDate");
