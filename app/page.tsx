// app/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const { userId } = await auth();

  // 1. If not logged in, send to Sign In page
  if (!userId) {
    redirect("/sign-in");
  }

  // 2. If logged in, send to the "Traffic Cop" to decide Admin vs Teacher
  redirect("/check-role");
}