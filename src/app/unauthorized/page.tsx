export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
      <section className="max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30 backdrop-blur">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">TransitOps</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Unauthorized</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Your account does not have access to this area yet. Contact an administrator if you think this is a mistake.
        </p>
      </section>
    </main>
  );
}