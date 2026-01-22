const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    const courseOnSlots = await prisma.courseOnSlot.findMany({
      include: {
        course: true,
        slot: { include: { room: true } },
        enrollments: { where: { status: 'ACTIVE' } }
      }
    });
    console.log('CourseOnSlot records:', courseOnSlots.length);
    courseOnSlots.forEach(cos => {
      console.log(`- ${cos.course.name} in ${cos.slot.room.name} (${cos.enrollments.length}/${cos.slot.room.capacity})`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();