import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedNewEnglishBatch() {
  console.log('Enrolling new English batch students only...')

  // Mapping provided Slot IDs to the English Classes from the image
  const englishSlotMapping: { [key: string]: string } = {
    'English 3 to 4': 'f392d634-a3e7-4f2e-8c32-595f8c66cf47',
    'English 4 to 5': '715e02cc-8f6f-4721-af31-1e1cff76aefd',
    'English 5 to 6': 'c220c156-2b09-4473-bac1-838eb5517ad1',
    'English 6 to 7': '305ba1da-53a6-4c6b-a20e-0d1ab475300c',
    'English 7 to 8': '46cafb6c-2bb8-4f3d-bcdd-1175526f938a',
  }

  const newEnglishStudents = [
    // --- English 3 to 4 ---
    { name: 'Faizan Shah', fatherName: 'Rehman Shah', phone: '0370-2926829', address: 'Bakrapiri Lyari', day: 9, className: 'English 3 to 4' },
    { name: 'Aniq', fatherName: 'M. Amin', phone: '0322-1461151', address: 'Rancoline K.M.C', day: 10, className: 'English 3 to 4' },
    { name: 'Aleemullah', fatherName: 'Khan', phone: '0341-0732434', address: 'Dhobighat', day: 2, className: 'English 3 to 4' },
    { name: 'Iqra Fahad', fatherName: 'Nazeer Ahmed', phone: '0332-2230313', address: 'Jubli Hoti Market', day: 10, className: 'English 3 to 4' },
    { name: 'Zunairah', fatherName: 'Nasir Hussain', phone: '0318-2483577', address: 'Celawm compound', day: 5, className: 'English 3 to 4' },
    { name: 'Huzaifa Khursheed', fatherName: 'Haji Khurshed', phone: '0308-3996646', address: 'Garden Interchange', day: 12, className: 'English 3 to 4' },
    { name: 'Shezad', fatherName: 'Zahid Hussain', phone: '0322-1830822', address: 'Garden Interchange', day: 12, className: 'English 3 to 4' },
    // --- English 4 to 5 ---
    { name: 'Daniyal', fatherName: 'Abdul Wah', phone: '0334-2036459', address: 'Babu pidi wali gali', day: 5, className: 'English 4 to 5' },
    { name: 'Owais', fatherName: 'Noor-Ali', phone: '0311-2121052', address: 'Shoe-market Azeem Plaza', day: 5, className: 'English 4 to 5' },
    { name: 'Farman', fatherName: 'Noor-Ali', phone: '0311-2121052', address: 'Shoe-market Azeem Plaza', day: 5, className: 'English 4 to 5' },
    { name: 'Maaz', fatherName: 'Gul tareen', phone: '0311-2121052', address: 'Shoe-market Azeem Plaza', day: 5, className: 'English 4 to 5' },
    { name: 'Sabir', fatherName: 'A. Qader', phone: '0328-3310347', address: 'G Ghasmandi', day: 5, className: 'English 4 to 5' },
    { name: 'Ayan', fatherName: 'Altaf Hussa', phone: '0335-3454606', address: 'C-12 Sadaf Arcade', day: 19, className: 'English 4 to 5' },
    { name: 'Dua Fatima', fatherName: 'Kamran', phone: '0329-3071415', address: 'Garden West Jilani masjid', day: 18, className: 'English 4 to 5' },
    { name: 'Maheen', fatherName: 'M. Shahid', phone: '0310-3376699', address: 'Ghausia Hall', day: 20, className: 'English 4 to 5' },
    // --- English 5 to 6 ---
    { name: 'Saeed', fatherName: 'M. Riaz', phone: '0324-2728973', address: 'Gareeb Shah market Lyari', day: 5, className: 'English 5 to 6' },
    { name: 'Sanaullah', fatherName: 'Abdul Sale', phone: '0315-2339311', address: 'Gareeb Shah market Lyari', day: 5, className: 'English 5 to 6' },
    { name: 'mehraj', fatherName: 'Haji Siraj', phone: '0325-3706879', address: 'Garden east Naseem Clothes', day: 5, className: 'English 5 to 6' },
    { name: 'Umer', fatherName: 'Faisal', phone: '0325-7285069', address: 'Gareeb Shah market Lyari', day: 20, className: 'English 5 to 6' },
    { name: 'Yousuf', fatherName: 'Jabar', phone: '0320-8353384', address: 'Garden West Fawara Chowk', day: 12, className: 'English 5 to 6' },
    { name: 'naurooz', fatherName: 'qaiyum', phone: '0323-2015754', address: 'Rexar line Kalakot lyari', day: 5, className: 'English 5 to 6' },
    { name: 'Umer', fatherName: 'M Anwar', phone: '0329-2271771', address: 'garden Thana kadija building', day: 5, className: 'English 5 to 6' },
    { name: 'Gazain', fatherName: 'Mounwar', phone: '0313-2983793', address: 'Garden East', day: 12, className: 'English 5 to 6' },
    { name: 'Humayun', fatherName: 'Shah Nazar', phone: '0345-3532881', address: 'Karachi Shoe Market', day: 15, className: 'English 5 to 6' },
    { name: 'Essa', fatherName: 'umer', phone: '0309-1028462', address: 'Garden East', day: 15, className: 'English 5 to 6' },
    { name: 'Adina', fatherName: 'Moinuddin', phone: '0321-2062414', address: 'Nearby Lyari', day: 9, className: 'English 5 to 6' },
    { name: 'Umaima', fatherName: 'Akeel Jaba', phone: '+971-563142596', address: 'Nearby Baghehalar', day: 1, className: 'English 5 to 6' },
    // --- English 6 to 7 ---
    { name: 'Huzaifa', fatherName: 'Haji Tahur', phone: '0310-2778695', address: 'Mirza Adam Khan rd', day: 12, className: 'English 6 to 7' },
    { name: 'Alina', fatherName: 'M. Sajjad', phone: '0322-2724418', address: 'Shoe market', day: 2, className: 'English 6 to 7' },
    { name: 'Ali Ahmed', fatherName: 'Zaheer Ahmed', phone: '0307-9388654', address: 'FMD Khan Road', day: 10, className: 'English 6 to 7' },
    { name: 'Sana', fatherName: 'A. Majeed', phone: '0316-1103526', address: 'Babudin masjid', day: 8, className: 'English 6 to 7' },
    { name: 'Aiman', fatherName: 'Sadiq', phone: '0324-8071081', address: 'Diamond palace', day: 24, className: 'English 6 to 7' },
    { name: 'Khalid', fatherName: 'Akhter Hussain', phone: '0323-1397131', address: 'Ramswami Brush Wali Gali', day: 3, className: 'English 6 to 7' },
    // --- English 7 to 8 ---
    { name: 'Misbah', fatherName: 'M. Arif', phone: '0313-2651916', address: 'Essa palace 5th floor', day: 1, className: 'English 7 to 8' },
    { name: 'Madani', fatherName: 'Muhammad Munir', phone: '0331-3625246', address: 'Jilani Masjid Garden West', day: 15, className: 'English 7 to 8' },
    { name: 'Farhan', fatherName: 'R-Salman', phone: '0336-9227007', address: 'Garden Police Headquarter', day: 8, className: 'English 7 to 8' },
    { name: 'Safi', fatherName: 'Arif', phone: '0324-5111841', address: 'Jilani Masjid Building', day: 4, className: 'English 7 to 8' },
    { name: 'Ayan', fatherName: 'Mustafa', phone: '0312-2942810', address: 'AL Saidiq-e-Center', day: 5, className: 'English 7 to 8' },
    { name: 'Hani', fatherName: 'M. Adnan', phone: '0315-2467316', address: 'Shoe-market Maina road', day: 6, className: 'English 7 to 8' },
    { name: 'Abdullah', fatherName: 'Muhammad Akhter', phone: '0327-2451641', address: 'AL Qadir Lateef Tower', day: 14, className: 'English 7 to 8' }
  ]

  let count = 1
  for (const data of newEnglishStudents) {
    const targetDate = new Date(2025, 11, data.day) // Dec 2025
    const studentIdStr = `SCI-202512-${String(count).padStart(3, '0')}` //
    const slotId = englishSlotMapping[data.className]

    // Create new student
    const student = await prisma.student.create({
      data: {
        name: data.name, //
        fatherName: data.fatherName, //
        phone: data.phone, //
        address: data.address, //
        studentId: studentIdStr,
        admission: targetDate
      }
    })

    // Create enrollment
    await prisma.enrollment.create({
      data: {
        studentId: student.id,
        courseOnSlotId: slotId,
        joiningDate: targetDate,
        status: 'ACTIVE'
      }
    })

    console.log(`✅ Enrolled: ${data.name} (ID: ${studentIdStr})`)
    count++
  }
}

async function main() {
  try {
    await seedNewEnglishBatch()
    console.log('--- English Batch Seeding Completed! ---')
  } catch (e) {
    console.error(e)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()