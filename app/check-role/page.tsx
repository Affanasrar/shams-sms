// app/check-role/page.tsx
import { auth, currentUser } from "@clerk/nextjs/server"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"

export default async function CheckRolePage() {
  const { userId } = await auth()
  const user = await currentUser()

  if (!userId || !user) {
    redirect("/sign-in")
  }

  // 1. Try to find the user in our Database
  let dbUser = await prisma.user.findUnique({
    where: { clerkId: userId }
  })

  // 2. SELF-HEALING: If user is missing in DB, create them now!
  // This solves the issue where the Webhook failed or hasn't run yet.
  if (!dbUser) {
    const email = user.emailAddresses[0].emailAddress
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || "Teacher"
    
    console.log(`🛠️ Auto-Creating User in DB: ${email}`)

    // By default, we assume anyone YOU manually created in Clerk is a TEACHER
    // (Unless it's you, the Super Admin)
    const role = email.includes("admin") ? "ADMIN" : "TEACHER"

    dbUser = await prisma.user.create({
      data: {
        clerkId: userId,
        email: email,
        firstName: user.firstName || "New",
        lastName: user.lastName || "Teacher",
        role: role as "ADMIN" | "TEACHER"
      }
    })
  }

  // 3. The Grand Redirect
  if (dbUser.role === 'ADMIN') {
    redirect("/admin")
  } else if (dbUser.role === 'TEACHER') {
    redirect("/teacher")
  } else {
    // Fallback for students or parents if you add them later
    return <div>Role not assigned. Contact Admin.</div>
  }
}