"use client";

import { useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type View = "sign-in" | "forgot-email" | "forgot-code" | "forgot-new-password";

export default function SignInPage() {
  const { signIn } = useSignIn();

  // Sign-in state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Forgot password state
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [view, setView] = useState<View>("sign-in");
  const [loading, setLoading] = useState(false);

  if (!signIn) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.06),_transparent_60%),linear-gradient(180deg,_#f8fafc,_#eef2ff)] text-slate-500">
        Loading…
      </main>
    );
  }

  const clerkErr = (err: unknown) =>
    (err as { message?: string })?.message ??
    (err as { errors?: { message: string }[] })?.errors?.[0]?.message ??
    "Something went wrong";

  /* ── Sign in ─────────────────────────────────────────── */
  async function handleSignIn() {
    if (!email || !password) { toast.error("Please enter your email and password"); return; }
    setLoading(true);
    try {
      const { error } = await signIn.password({ identifier: email, password });
      if (error) throw error;
      const { error: fe } = await signIn.finalize();
      if (fe) throw fe;
      window.location.href = "/dashboard";
    } catch (err) {
      toast.error(clerkErr(err));
    } finally {
      setLoading(false);
    }
  }

  /* ── Step 1 – init sign-in & send reset code ─────────── */
  async function handleSendResetCode() {
    if (!resetEmail) { toast.error("Enter your email address"); return; }
    setLoading(true);
    try {
      // Initialise the sign-in with the identifier
      const { error: ce } = await signIn.create({ identifier: resetEmail });
      if (ce) throw ce;
      // Send the reset code
      const { error: se } = await signIn.resetPasswordEmailCode.sendCode();
      if (se) throw se;
      toast.success("Reset code sent — check your email");
      setView("forgot-code");
    } catch (err) {
      toast.error(clerkErr(err));
    } finally {
      setLoading(false);
    }
  }

  /* ── Step 2 – verify code ────────────────────────────── */
  async function handleVerifyCode() {
    if (!resetCode) { toast.error("Enter the reset code"); return; }
    setLoading(true);
    try {
      const { error } = await signIn.resetPasswordEmailCode.verifyCode({ code: resetCode });
      if (error) throw error;
      setView("forgot-new-password");
    } catch (err) {
      toast.error(clerkErr(err));
    } finally {
      setLoading(false);
    }
  }

  /* ── Step 3 – set new password & finalize ────────────── */
  async function handleSetNewPassword() {
    if (!newPassword || !confirmNewPassword) { toast.error("Fill in all fields"); return; }
    if (newPassword !== confirmNewPassword) { toast.error("Passwords do not match"); return; }
    setLoading(true);
    try {
      const { error: pe } = await signIn.resetPasswordEmailCode.submitPassword({ password: newPassword });
      if (pe) throw pe;
      const { error: fe } = await signIn.finalize();
      if (fe) throw fe;
      toast.success("Password reset! Signing you in…");
      window.location.href = "/dashboard";
    } catch (err) {
      toast.error(clerkErr(err));
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10";

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.06),_transparent_60%),linear-gradient(180deg,_#f8fafc,_#eef2ff)] px-6 py-12 text-slate-950">
      {/* Back button */}
      <Link
        href="/"
        className="absolute left-6 top-6 inline-flex h-10 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
      >
        <ArrowLeft className="size-4" />
        Back
      </Link>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950">
            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-base font-semibold tracking-tight text-slate-950">TransitOps</span>
        </div>

        <section className="rounded-[2rem] border border-slate-200/80 bg-white/80 p-8 shadow-[0_24px_80px_-24px_rgba(15,23,42,0.2)] backdrop-blur">

          {/* ── VIEW: Sign in ──────────────────────────── */}
          {view === "sign-in" && (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Welcome back</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Sign in to your account</h1>
              <p className="mt-2 text-sm text-slate-500">
                Don&apos;t have an account?{" "}
                <Link href="/sign-up" className="font-semibold text-slate-900 underline-offset-2 hover:underline">
                  Create one
                </Link>
              </p>

              <div className="mt-8 space-y-5">
                <label className="block text-sm font-medium text-slate-700">
                  Email address
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                    placeholder="you@example.com"
                    className={inputCls}
                  />
                </label>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">Password</span>
                    <button
                      type="button"
                      onClick={() => { setResetEmail(email); setView("forgot-email"); }}
                      className="text-xs font-medium text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                    placeholder="••••••••"
                    className={inputCls}
                  />
                </div>

                <Button
                  id="sign-in-btn"
                  type="button"
                  onClick={handleSignIn}
                  disabled={loading}
                  className="w-full rounded-2xl py-3 text-base font-semibold"
                >
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
              </div>
            </>
          )}

          {/* ── VIEW: Enter email for reset ───────────── */}
          {view === "forgot-email" && (
            <>
              <button
                type="button"
                onClick={() => setView("sign-in")}
                className="mb-5 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900"
              >
                <ArrowLeft className="size-3.5" /> Back to sign in
              </button>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Password reset</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Forgot your password?</h1>
              <p className="mt-2 text-sm text-slate-500">
                Enter the email address linked to your account and we&apos;ll send you a reset code.
              </p>

              <div className="mt-8 space-y-5">
                <label className="block text-sm font-medium text-slate-700">
                  Email address
                  <input
                    id="reset-email"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendResetCode()}
                    placeholder="you@example.com"
                    className={inputCls}
                  />
                </label>

                <Button
                  type="button"
                  onClick={handleSendResetCode}
                  disabled={loading}
                  className="w-full rounded-2xl py-3 text-base font-semibold"
                >
                  {loading ? "Sending…" : "Send reset code"}
                </Button>
              </div>
            </>
          )}

          {/* ── VIEW: Enter code ──────────────────────── */}
          {view === "forgot-code" && (
            <>
              <button
                type="button"
                onClick={() => setView("forgot-email")}
                className="mb-5 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900"
              >
                <ArrowLeft className="size-3.5" /> Back
              </button>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Password reset</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Check your email</h1>
              <p className="mt-2 text-sm text-slate-500">
                Enter the 6-digit code sent to{" "}
                <span className="font-medium text-slate-800">{resetEmail}</span>.
              </p>

              <div className="mt-8 space-y-5">
                <label className="block text-sm font-medium text-slate-700">
                  Reset code
                  <input
                    id="reset-code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => e.key === "Enter" && handleVerifyCode()}
                    placeholder="123456"
                    className={`${inputCls} tracking-[0.4em] text-center text-lg`}
                  />
                </label>

                <Button
                  type="button"
                  onClick={handleVerifyCode}
                  disabled={loading}
                  className="w-full rounded-2xl py-3 text-base font-semibold"
                >
                  {loading ? "Verifying…" : "Verify code"}
                </Button>

                <button
                  type="button"
                  onClick={handleSendResetCode}
                  className="w-full text-center text-xs text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline"
                >
                  Didn&apos;t receive a code? Resend
                </button>
              </div>
            </>
          )}

          {/* ── VIEW: Set new password ────────────────── */}
          {view === "forgot-new-password" && (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Password reset</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Set a new password</h1>
              <p className="mt-2 text-sm text-slate-500">Choose a strong password for your account.</p>

              <div className="mt-8 space-y-5">
                <label className="block text-sm font-medium text-slate-700">
                  New password
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className={inputCls}
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Confirm new password
                  <input
                    id="confirm-new-password"
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSetNewPassword()}
                    placeholder="••••••••"
                    className={inputCls}
                  />
                </label>

                <Button
                  type="button"
                  onClick={handleSetNewPassword}
                  disabled={loading}
                  className="w-full rounded-2xl py-3 text-base font-semibold"
                >
                  {loading ? "Saving…" : "Reset password"}
                </Button>
              </div>
            </>
          )}

        </section>
      </div>
    </main>
  );
}