// scripts/fix-enrollment-dates.ts
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Starting to fix missing endDates...')

  try {
    // Fetch all enrollments without endDate
    const enrollmentsWithoutEndDate = await prisma.enrollment.findMany({
      where: { endDate: null },
      include: {
        courseOnSlot: {
          include: { course: true }
        }
      }
    })

    console.log(`Found ${enrollmentsWithoutEndDate.length} enrollments missing endDate`)

    if (enrollmentsWithoutEndDate.length === 0) {
      console.log('✅ All enrollments already have endDate!')
      return
    }

    // Update each enrollment with calculated endDate
    for (const enrollment of enrollmentsWithoutEndDate) {
      const courseDurationMonths = enrollment.courseOnSlot.course.durationMonths
      const joiningDate = new Date(enrollment.joiningDate)
      
      // Calculate endDate: joining date + course duration in months
      const endDate = new Date(
        joiningDate.getFullYear(),
        joiningDate.getMonth() + courseDurationMonths,
        joiningDate.getDate()
      )

      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: { endDate }
      })

      console.log(
        `✅ Updated: ${enrollment.courseOnSlot.course.name} - ${new Date(joiningDate).toLocaleDateString()} → ${endDate.toLocaleDateString()}`
      )
    }

    console.log(`\n✅ Successfully updated ${enrollmentsWithoutEndDate.length} enrollments with endDate!`)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
