// app/page.tsx
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export default async function HomePage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    redirect("/sign-in");
  }

  let dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!dbUser) {
    const email = user.emailAddresses[0]?.emailAddress ?? "";
    const role = email.includes("admin") ? "ADMIN" : "TEACHER";

    dbUser = await prisma.user.create({
      data: {
        clerkId: userId,
        email,
        firstName: user.firstName || "New",
        lastName: user.lastName || "Teacher",
        role: role as "ADMIN" | "TEACHER",
      },
    });
  }

  if (dbUser.role === "ADMIN") {
    redirect("/admin");
  }

  if (dbUser.role === "TEACHER") {
    redirect("/teacher");
  }

  return <div>Role not assigned. Contact Admin.</div>;
}
