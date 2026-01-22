// app/api/cron/fees/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addDays, getDate, lastDayOfMonth, isSameDay } from 'date-fns';

export async function GET(req: Request) {
  // 1. Security Check (Prevent hackers from triggering fees)
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const today = new Date();
  const logs: string[] = [];
  
  // 2. Find ALL Active Students
  // We need to check everyone.
  const activeEnrollments = await prisma.enrollment.findMany({
    where: { status: 'ACTIVE' },
    include: { 
        student: true,
        courseOnSlot: { include: { course: true }}
    }
  });

  let feesCreatedCount = 0;

  for (const enrollment of activeEnrollments) {
    const joinDate = enrollment.joiningDate;
    
    // 3. The "Rolling" Logic
    // Does the day of the month match? (e.g., Joined 21st, Today is 21st)
    const isAnniversary = getDate(joinDate) === getDate(today);
    
    // Handle "End of Month" edge case (Joined 31st, Today is Feb 28th)
    const isEndOfMonth = isSameDay(today, lastDayOfMonth(today)) && getDate(joinDate) > getDate(today);

    if (isAnniversary || isEndOfMonth) {
      
      // 4. Check if they have finished the course
      // If Today > EndDate, they are done. Don't charge. Mark Completed.
      if (enrollment.endDate && today > enrollment.endDate) {
         // Auto-graduate the student
         await prisma.enrollment.update({
            where: { id: enrollment.id },
            data: { status: 'COMPLETED' }
         });
         logs.push(`🎓 Student ${enrollment.student.name} graduated.`);
         continue; 
      }

      // 5. Generate the Fee
      // We check if a fee for this specific cycle already exists to prevent duplicates
      const existingFee = await prisma.fee.findFirst({
        where: {
            enrollmentId: enrollment.id,
            cycleDate: {
                gte: new Date(today.setHours(0,0,0,0)),
                lt: new Date(today.setHours(23,59,59,999))
            }
        }
      });

      if (!existingFee && enrollment.courseOnSlot.course.feeType === 'MONTHLY') {
        await prisma.fee.create({
            data: {
                studentId: enrollment.studentId,
                enrollmentId: enrollment.id,
                amount: enrollment.courseOnSlot.course.baseFee,
                dueDate: addDays(today, 5), // Give them 5 days to pay
                cycleDate: new Date(),     // "This fee is for THIS month"
                status: 'UNPAID'
            }
        });
        feesCreatedCount++;
        logs.push(`💰 Generated Fee for ${enrollment.student.name}`);
      }
    }
  }

  return NextResponse.json({ 
    success: true, 
    processed: activeEnrollments.length, 
    generated: feesCreatedCount,
    logs 
  });
}