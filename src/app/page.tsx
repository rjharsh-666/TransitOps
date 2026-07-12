import Link from "next/link";

export const metadata = {
  title: "TransitOps — Fleet Operations Platform",
  description: "Fleet operations, dispatch, and reporting in one unified workflow.",
};

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.06),_transparent_60%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-6 py-10 text-slate-950">
      {/* Nav */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950">
            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-base font-semibold tracking-tight text-slate-950">TransitOps</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="inline-flex h-9 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto mt-24 max-w-6xl">
        <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-200/70 bg-indigo-50/80 px-3.5 py-1.5 text-xs font-medium text-indigo-700 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500"></span>
              </span>
              Role-based access · Driver management · Live dispatch
            </div>
            <h1 className="text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
              Fleet operations,<br />
              <span className="bg-gradient-to-br from-slate-900 via-slate-700 to-slate-500 bg-clip-text text-transparent">
                simplified.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-500">
              TransitOps brings together driver management, vehicle tracking, trip dispatch, fuel logging, and financial reporting into one seamless workflow.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link
                href="/sign-up"
                className="inline-flex h-12 items-center justify-center rounded-full bg-slate-950 px-7 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 hover:shadow-slate-900/30"
              >
                Create account
              </Link>
              <Link
                href="/sign-in"
                className="inline-flex h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-7 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
              >
                Sign in
              </Link>
            </div>
          </div>

          {/* Feature card */}
          <div className="hidden shrink-0 lg:block">
            <div className="w-72 rounded-[2rem] border border-slate-200/80 bg-white/80 p-6 shadow-[0_20px_60px_-16px_rgba(15,23,42,0.2)] backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Platform overview</p>
              <div className="mt-4 space-y-3">
                {[
                  { label: "Driver Management", desc: "License, status & routing" },
                  { label: "Vehicle Tracking", desc: "Fleet status & maintenance" },
                  { label: "Trip Dispatch", desc: "Schedule, assign & complete" },
                  { label: "Financial Reports", desc: "Revenue, fuel & expenses" },
                ].map((f) => (
                  <div key={f.label} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                    <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-slate-950" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{f.label}</p>
                      <p className="text-xs text-slate-500">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-20 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { value: "Role-Based", label: "Access Control" },
            { value: "Real-time", label: "Fleet Tracking" },
            { value: "Multi-role", label: "Approval Flows" },
            { value: "Full-stack", label: "Next.js & Prisma" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-slate-200/80 bg-white/70 px-5 py-4 backdrop-blur">
              <p className="text-lg font-semibold text-slate-950">{stat.value}</p>
              <p className="mt-0.5 text-sm text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

