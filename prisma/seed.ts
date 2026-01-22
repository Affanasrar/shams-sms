// prisma/seed.ts
import { PrismaClient, FeeType } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting Seed...')

  // 1. Clean up existing data (Optional: Be careful in production!)
  // await prisma.enrollment.deleteMany()
  // await prisma.courseOnSlot.deleteMany()
  // await prisma.slot.deleteMany()
  // await prisma.course.deleteMany()
  // await prisma.room.deleteMany()

  // 2. Create Physical Resources (Rooms)
  const lab1 = await prisma.room.create({
    data: {
      name: 'Computer Lab 1',
      capacity: 15, // Rigid capacity constraint
    },
  })
  console.log(`Created Room: ${lab1.name} (ID: ${lab1.id})`)

  // 3. Create Slots (Time Blocks for Lab 1)
  // Creating a 9:00 AM - 10:00 AM slot for Mon,Tue,Wed
  const slot9to10 = await prisma.slot.create({
    data: {
      roomId: lab1.id,
      startTime: new Date('1970-01-01T09:00:00Z'), // Generic time
      endTime: new Date('1970-01-01T10:00:00Z'),
      days: 'Mon,Tue,Wed',
    },
  })
  console.log(`Created Slot: 9-10 AM (ID: ${slot9to10.id})`)

  // 4. Create Courses
  const courseOffice = await prisma.course.create({
    data: {
      name: 'MS Office Professional',
      durationMonths: 3,
      baseFee: 1500.00,
      feeType: FeeType.MONTHLY,
    },
  })
  
  const courseEnglish = await prisma.course.create({
    data: {
      name: 'English Language',
      durationMonths: 4,
      baseFee: 2000.00,
      feeType: FeeType.MONTHLY,
    },
  })
  console.log('Created Courses: MS Office, English')

  // 5. Assign Courses to the Slot (The "Shared Capacity" Logic)
  // Both MS Office AND English will run in Lab 1 at 9-10 AM
  const assignment1 = await prisma.courseOnSlot.create({
    data: {
      slotId: slot9to10.id,
      courseId: courseOffice.id,
    }
  })

  const assignment2 = await prisma.courseOnSlot.create({
    data: {
      slotId: slot9to10.id,
      courseId: courseEnglish.id,
    }
  })

  console.log('✅ Seeding Completed. Lab 1 is ready for shared enrollment.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })