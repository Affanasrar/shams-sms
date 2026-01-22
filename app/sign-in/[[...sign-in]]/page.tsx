// app/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="shadow-xl rounded-2xl overflow-hidden">
        <SignIn />
      </div>
    </div>
  );
}