const {PrismaClient} = require('@prisma/client')
const prisma = new PrismaClient()

;(async () => {
  try {
    const histories = await prisma.courseFeeHistory.findMany({ orderBy: { changedAt: 'desc' }, take: 5 })
    console.log('latest fee history entries:', histories)

    const enrollments = await prisma.enrollment.findMany({
      include: {
        courseOnSlot: { include: { course: true } },
        student: true,
        fees: { orderBy: { cycleDate: 'asc' } }
      },
      take: 20
    })

    console.log('sample enrollments:', enrollments.length)
    for (const e of enrollments) {
      if (!e.fees || e.fees.length === 0) continue
      const firstFee = e.fees[0]
      const course = e.courseOnSlot.course
      const enrollmentDate = e.joiningDate.toISOString().split('T')[0]
      const recentFee = e.fees[e.fees.length - 1]
      console.log(`enr ${e.id} student:${e.student.name} joined:${enrollmentDate} course:${course.name} base:${Number(course.baseFee)} firstFee:${Number(firstFee.amount)} recentFee:${Number(recentFee.amount)} fees:${e.fees.length}`)
    }

    // check for both pre and post fee update patients
    const firstHistory = histories[histories.length-1]
    if (firstHistory) {
      const underOld = await prisma.enrollment.findFirst({
        where: {
          courseOnSlot: { courseId: firstHistory.courseId },
          joiningDate: { lte: firstHistory.changedAt }
        },
        include: {fees:true, student:true, courseOnSlot:{include:{course:true}}}
      })
      const afterNew = await prisma.enrollment.findFirst({
        where: {
          courseOnSlot: { courseId: firstHistory.courseId },
          joiningDate: { gt: firstHistory.changedAt }
        },
        include: {fees:true, student:true, courseOnSlot:{include:{course:true}}}
      })

      console.log('old enrollment around fee change', underOld ? {
        student:underOld.student.name,
        joined:underOld.joiningDate,
        courseFee:underOld.courseOnSlot.course.baseFee,
        firstFee: underOld.fees[0]?.amount,
        feeHistory: firstHistory
      } : 'none')
      console.log('new enrollment around fee change', afterNew ? {
        student:afterNew.student.name,
        joined:afterNew.joiningDate,
        courseFee:afterNew.courseOnSlot.course.baseFee,
        firstFee: afterNew.fees[0]?.amount,
        feeHistory: firstHistory
      } : 'none')
    }

  } catch (e) {
    console.error('ERR', e)
  } finally {
    await prisma.$disconnect()
  }
})()
