export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_45%),linear-gradient(180deg,_#f8fafc,_#eef2ff)] px-6 py-10 text-slate-950">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl flex-col justify-center rounded-[2rem] border border-slate-200/80 bg-white/80 p-8 shadow-[0_24px_80px_-24px_rgba(15,23,42,0.35)] backdrop-blur sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">TransitOps</p>
        <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
          Fleet operations, dispatch, and reporting in one workflow.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
          The project is wired for Clerk authentication, Neon Postgres, and Prisma. Start with sign in, then move into the role-based dashboard.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <a
            href="/sign-in"
            className="inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
          >
            Sign in
          </a>
          <a
            href="/sign-up"
            className="inline-flex h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Create account
          </a>
        </div>
      </section>
    </main>
  );
}
