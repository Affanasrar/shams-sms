import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(79,70,229,0.22),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.18),_transparent_34%)] px-4 py-10">
      <div className="premium-panel w-full max-w-5xl overflow-hidden p-2 sm:p-3">
        <div className="flex flex-col overflow-hidden rounded-[24px] bg-slate-950/95 text-white lg:flex-row">
          <div className="flex flex-1 flex-col justify-between bg-gradient-to-br from-slate-900 via-indigo-950 to-sky-950 p-8 sm:p-10">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-200">Shams SMS</p>
              <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">Start your school operations with confidence.</h1>
              <p className="mt-4 max-w-md text-sm text-slate-300 sm:text-base">Create your account and open the door to a faster, more polished school management workflow.</p>
            </div>
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-slate-200">
              <p className="font-medium">Included from day one</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li>• Student and enrollment management</li>
                <li>• Attendance and fee visibility</li>
                <li>• A calm, premium experience across devices</li>
              </ul>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center bg-white p-4 sm:p-8">
            <SignUp routing="hash" signInUrl="/sign-in" />
          </div>
        </div>
      </div>
    </main>
  );
}