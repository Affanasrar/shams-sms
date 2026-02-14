const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Format time to 12-hour format with AM/PM
function formatTime(date) {
  return new Date(date).toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

async function fetchSlotsWithCourses() {
  try {
    // Fetch all slots with their room details and assigned courses
    const slots = await prisma.slot.findMany({
      select: {
        id: true,
        startTime: true,
        endTime: true,
        days: true,
        room: {
          select: {
            id: true,
            name: true,
            capacity: true,
          },
        },
        courses: {
          select: {
            id: true,
            courseId: true,
            teacherId: true,
            course: {
              select: {
                id: true,
                name: true,
                durationMonths: true,
                baseFee: true,
                feeType: true,
              },
            },
            teacher: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            enrollments: {
              select: {
                id: true,
                student: {
                  select: {
                    id: true,
                    studentId: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    console.log('\n========================================');
    console.log('SLOTS WITH ASSIGNED COURSES');
    console.log('========================================\n');

    slots.forEach((slot, index) => {
      console.log(`\n[SLOT ${index + 1}]`);
      console.log(`ID: ${slot.id}`);
      console.log(`Time: ${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`);
      console.log(`Days: ${slot.days}`);
      console.log(`Room: ${slot.room.name} (ID: ${slot.room.id}, Capacity: ${slot.room.capacity})`);

      if (slot.courses && slot.courses.length > 0) {
        console.log(`\n  Assigned Courses (${slot.courses.length}):`);
        slot.courses.forEach((courseOnSlot, courseIndex) => {
          console.log(`\n  ├─ Course ${courseIndex + 1}: ${courseOnSlot.course.name}`);
          console.log(`  │  CourseOnSlot ID: ${courseOnSlot.id}`);
          console.log(`  │  Course ID: ${courseOnSlot.course.id}`);
          console.log(`  │  Duration: ${courseOnSlot.course.durationMonths} months`);
          console.log(`  │  Base Fee: ${courseOnSlot.course.baseFee} (${courseOnSlot.course.feeType})`);

          if (courseOnSlot.teacher) {
            console.log(
              `  │  Teacher: ${courseOnSlot.teacher.firstName} ${courseOnSlot.teacher.lastName} (${courseOnSlot.teacher.email})`
            );
          } else {
            console.log(`  │  Teacher: Not assigned`);
          }

          if (courseOnSlot.enrollments && courseOnSlot.enrollments.length > 0) {
            console.log(`  │  Enrolled Students (${courseOnSlot.enrollments.length}):`);
            courseOnSlot.enrollments.forEach((enrollment, studentIndex) => {
              console.log(
                `  │    ${studentIndex + 1}. ${enrollment.student.name} (ID: ${enrollment.student.studentId})`
              );
            });
          } else {
            console.log(`  │  No students enrolled`);
          }
        });
      } else {
        console.log(`  No courses assigned to this slot`);
      }

      console.log('\n  ' + '-'.repeat(70));
    });

    console.log('\n========================================');
    console.log('SUMMARY');
    console.log('========================================');
    console.log(`Total Slots: ${slots.length}`);
    const totalCourses = slots.reduce((sum, slot) => sum + (slot.courses?.length || 0), 0);
    console.log(`Total Course Assignments: ${totalCourses}`);
    const totalEnrollments = slots.reduce((sum, slot) => {
      return sum + (slot.courses?.reduce((courseSum, course) => courseSum + (course.enrollments?.length || 0), 0) || 0);
    }, 0);
    console.log(`Total Enrollments: ${totalEnrollments}`);
    console.log('\n');

  } catch (error) {
    console.error('Error fetching slots:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fetchSlotsWithCourses();
