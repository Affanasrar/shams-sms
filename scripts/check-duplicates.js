const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDuplicates() {
  const enrollments = await prisma.enrollment.findMany({
    where: { student: { name: 'Ghulam Mustafa' } },
    include: { courseOnSlot: { include: { course: true } } }
  });

  console.log('Enrollments for Ghulam Mustafa:');
  enrollments.forEach(e => {
    console.log(`ID: ${e.id}, Course: ${e.courseOnSlot.course.name}, Status: ${e.status}, Joining: ${e.joiningDate.toISOString().split('T')[0]}`);
  });

  // Check fees for this student
  const fees = await prisma.fee.findMany({
    where: { student: { name: 'Ghulam Mustafa' } },
    orderBy: { cycleDate: 'desc' }
  });

  console.log(`\nFees for Ghulam Mustafa (${fees.length} total):`);
  fees.forEach(f => {
    console.log(`ID: ${f.id}, Enrollment: ${f.enrollmentId}, Cycle: ${f.cycleDate.toISOString().split('T')[0]}, Amount: ${f.finalAmount}, Discount: ${f.discountAmount}`);
  });

  // Check for duplicate fees in same cycle
  const groupedFees = {};
  fees.forEach(fee => {
    const key = `${fee.enrollmentId}-${fee.cycleDate.toISOString().split('T')[0]}`;
    if (!groupedFees[key]) groupedFees[key] = [];
    groupedFees[key].push(fee);
  });

  console.log('\nDuplicate analysis:');
  Object.keys(groupedFees).forEach(key => {
    if (groupedFees[key].length > 1) {
      console.log(`DUPLICATE: ${key} - ${groupedFees[key].length} fees`);
    }
  });
}

checkDuplicates().catch(console.error).finally(() => prisma.$disconnect());