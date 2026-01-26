// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting Seed...')

  console.log('👨‍🎓 Creating existing students and enrollments...')

  // Replace this with your actual CourseOnSlot ID
  const defaultCourseOnSlotId = '4d529452-613e-4bac-a4f9-b5226fc5c4e5' 

  const studentsData = [
    {
      name: 'Madni',
      fatherName: 'Muhammad Munir',
      address: 'Jilani Masjid Garden West',
      phone: '0331-3625246',
      enrollmentDate: new Date('2025-12-15'), // Day 15
      admissionDate: new Date('2025-12-15'),
      courseOnSlotId: defaultCourseOnSlotId,
    },
    {
      name: 'Furhan',
      fatherName: 'R. Salman',
      address: 'Garden Police Headquarter',
      phone: '0336-9227007',
      enrollmentDate: new Date('2025-12-08'), // Day 8
      admissionDate: new Date('2025-12-08'),
      courseOnSlotId: defaultCourseOnSlotId,
    },
    {
      name: 'Safi',
      fatherName: 'Arif',
      address: 'Jilani Masjid Building Aisha',
      phone: '0324-5111841',
      enrollmentDate: new Date('2025-12-04'), // Day 4
      admissionDate: new Date('2025-12-04'),
      courseOnSlotId: defaultCourseOnSlotId,
    },
    {
      name: 'Ayan',
      fatherName: 'Mustafa',
      address: 'Shoe-market Al Sadiq-e-center',
      phone: '0312-2942810',
      enrollmentDate: new Date('2025-12-05'), // Day 5
      admissionDate: new Date('2025-12-05'),
      courseOnSlotId: defaultCourseOnSlotId,
    },
    {
      name: 'Hani',
      fatherName: 'M. Adnan',
      address: 'Shoe-market mama road',
      phone: '0315-2467316',
      enrollmentDate: new Date('2025-12-06'), // Day 6
      admissionDate: new Date('2025-12-06'),
      courseOnSlotId: defaultCourseOnSlotId,
    }
  ]

  // Logic to calculate studentId starting from the last known record in Dec 2025
  const existingStudents = await prisma.student.findMany({
    where: { studentId: { startsWith: 'SCI-2512-' } },
    select: { studentId: true }
  })

  const existingCounters = existingStudents
    .map(s => parseInt(s.studentId.split('-')[2]))
    .filter(n => !isNaN(n))

  const maxCounter = existingCounters.length > 0 ? Math.max(...existingCounters) : 0
  let studentCounter = maxCounter + 1

  for (const studentData of studentsData) {
    const year = studentData.admissionDate.getFullYear().toString().slice(-2)
    const month = (studentData.admissionDate.getMonth() + 1).toString().padStart(2, '0')
    const counter = studentCounter.toString().padStart(3, '0')
    const studentId = `SCI-${year}${month}-${counter}`

    const student = await prisma.student.create({
      data: {
        studentId,
        name: studentData.name,
        fatherName: studentData.fatherName,
        phone: studentData.phone,
        address: studentData.address,
        admission: studentData.admissionDate,
      },
    })
    
    await prisma.enrollment.create({
      data: {
        studentId: student.id,
        courseOnSlotId: studentData.courseOnSlotId,
        joiningDate: studentData.enrollmentDate,
        status: 'ACTIVE',
      },
    })
    
    console.log(`Created & Enrolled: ${student.name} (${student.studentId})`)
    studentCounter++
  }

  console.log('✅ Batch from image processed successfully.')
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })