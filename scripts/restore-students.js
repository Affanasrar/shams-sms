// restore-students.js
// Quick script to restore accidentally dropped students

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function restoreStudents() {
  try {
    console.log("🔍 Finding students to restore...\n");

    // 1. Find Saeed's dropped English Language enrollment
    const saeed = await prisma.student.findFirst({
      where: {
        name: {
          contains: "Saeed",
          mode: "insensitive",
        },
      },
    });

    if (saeed) {
      console.log(`✓ Found Saeed (ID: ${saeed.id})`);

      const saeedEnrollment = await prisma.enrollment.findFirst({
        where: {
          studentId: saeed.id,
          status: "DROPPED",
          courseOnSlot: {
            course: {
              name: {
                contains: "English",
                mode: "insensitive",
              },
            },
          },
        },
        include: {
          courseOnSlot: { include: { course: true } },
        },
      });

      if (saeedEnrollment) {
        console.log(
          `  ✓ Found dropped enrollment: ${saeedEnrollment.courseOnSlot.course.name}`
        );

        // Restore it
        await prisma.enrollment.update({
          where: { id: saeedEnrollment.id },
          data: {
            status: "ACTIVE",
            endDate: null,
          },
        });

        console.log(
          `  ✅ Restored: Saeed back to ${saeedEnrollment.courseOnSlot.course.name}\n`
        );
      } else {
        console.log("  ⚠️ No dropped English enrollment found for Saeed\n");
      }
    } else {
      console.log("⚠️ Saeed not found\n");
    }

    // 2. Find Muhammad Hassan's dropped Ms Office enrollment
    const hassan = await prisma.student.findFirst({
      where: {
        name: {
          contains: "Muhammad Hassan",
          mode: "insensitive",
        },
      },
    });

    if (hassan) {
      console.log(`✓ Found Muhammad Hassan (ID: ${hassan.id})`);

      const hassanEnrollment = await prisma.enrollment.findFirst({
        where: {
          studentId: hassan.id,
          status: "DROPPED",
          courseOnSlot: {
            course: {
              name: {
                contains: "Ms Office",
                mode: "insensitive",
              },
            },
          },
        },
        include: {
          courseOnSlot: { include: { course: true } },
        },
      });

      if (hassanEnrollment) {
        console.log(
          `  ✓ Found dropped enrollment: ${hassanEnrollment.courseOnSlot.course.name}`
        );

        // Restore it
        await prisma.enrollment.update({
          where: { id: hassanEnrollment.id },
          data: {
            status: "ACTIVE",
            endDate: null,
          },
        });

        console.log(
          `  ✅ Restored: Muhammad Hassan back to ${hassanEnrollment.courseOnSlot.course.name}\n`
        );
      } else {
        console.log("  ⚠️ No dropped Ms Office enrollment found for Hassan\n");
      }
    } else {
      console.log("⚠️ Muhammad Hassan not found\n");
    }

    console.log("✨ Restoration complete!");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreStudents();
