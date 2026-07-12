"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSignUp } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type AccountType = "Driver" | "OtherUser";

type DriverDetails = {
  hasHeavyVehiclePermit: boolean;
  yearsExperience: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryDate: string;
  contactNumber: string;
};

type SignupFormState = {
  firstName: string;
  lastName: string;
  emailAddress: string;
  password: string;
  confirmPassword: string;
  driver: DriverDetails;
};

export default function SignUpPage() {
  const router = useRouter();
  const { signUp, fetchStatus } = useSignUp();
  const [accountType, setAccountType] = useState<AccountType>("OtherUser");
  const [verificationStep, setVerificationStep] = useState(false);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [form, setForm] = useState<SignupFormState>({
    firstName: "",
    lastName: "",
    emailAddress: "",
    password: "",
    confirmPassword: "",
    driver: {
      hasHeavyVehiclePermit: false,
      yearsExperience: "",
      licenseNumber: "",
      licenseCategory: "",
      licenseExpiryDate: "",
      contactNumber: "",
    },
  });

  if (!signUp || fetchStatus === "fetching") {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">Loading sign up...</main>;
  }

  async function startSignup() {
    if (!signUp) return;

    if (!form.firstName || !form.lastName || !form.emailAddress || !form.password) {
      toast.error("Fill in the required fields");
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (accountType === "Driver") {
      if (!form.driver.licenseNumber || !form.driver.licenseCategory || !form.driver.licenseExpiryDate || !form.driver.contactNumber || !form.driver.yearsExperience) {
        toast.error("Complete the driver details");
        return;
      }
    }

    setLoading(true);
    try {
      const created = await signUp.create({
        firstName: form.firstName,
        lastName: form.lastName,
        emailAddress: form.emailAddress,
        password: form.password,
        unsafeMetadata: { signupType: accountType },
      });

      if (created.error) {
        throw created.error;
      }

      const verification = await signUp.verifications.sendEmailCode();
      if (verification.error) {
        throw verification.error;
      }

      setVerificationStep(true);
      toast.success("Verification code sent to your email");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start sign up");
    } finally {
      setLoading(false);
    }
  }

  async function completeVerification() {
    if (!signUp) return;

    if (!code) {
      toast.error("Enter the verification code");
      return;
    }

    setLoading(true);
    try {
      const verified = await signUp.verifications.verifyEmailCode({ code });
      if (verified.error) {
        throw verified.error;
      }

      const finalized = await signUp.finalize();
      if (finalized.error) {
        throw finalized.error;
      }

      const response = await fetch("/api/onboarding/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountType,
          driverApplication:
            accountType === "Driver"
              ? {
                  hasHeavyVehiclePermit: form.driver.hasHeavyVehiclePermit,
                  yearsExperience: Number(form.driver.yearsExperience),
                  licenseNumber: form.driver.licenseNumber,
                  licenseCategory: form.driver.licenseCategory,
                  licenseExpiryDate: form.driver.licenseExpiryDate,
                  contactNumber: form.driver.contactNumber,
                }
              : undefined,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to save onboarding data");
      }

      toast.success("Account created");
      router.replace(accountType === "Driver" ? "/driver-awaiting-approval" : "/role-request");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to verify sign up");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.06),_transparent_60%),linear-gradient(180deg,_#f8fafc,_#eef2ff)] px-6 py-12 pt-24 text-slate-950">
      {/* Back button */}
      <Link
        href="/"
        className="absolute left-6 top-6 inline-flex h-10 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
      >
        <ArrowLeft className="size-4" />
        Back
      </Link>
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[2rem] border border-slate-200/80 bg-white/80 p-8 shadow-[0_24px_80px_-24px_rgba(15,23,42,0.2)] backdrop-blur">
          {/* Logo */}
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950">
              <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-base font-semibold tracking-tight text-slate-950">TransitOps</span>
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">New account</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">Create your access path</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
            Choose whether you are joining as a driver or another user. Drivers submit license and experience details now. Other users continue to a role request page after registration.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {(["OtherUser", "Driver"] as AccountType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setAccountType(type)}
                className={`rounded-2xl border px-4 py-4 text-left transition ${accountType === type ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100"}`}
              >
                <div className="text-sm uppercase tracking-[0.3em] opacity-70">{type === "Driver" ? "Driver" : "Other user"}</div>
                <div className="mt-2 text-lg font-semibold">{type === "Driver" ? "Driver application" : "Standard account"}</div>
                <div className="mt-1 text-sm opacity-80">
                  {type === "Driver"
                    ? "Submit driving eligibility details and wait for approval."
                    : "Register first, then request the role you need from admin."}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200/80 bg-white/80 p-8 shadow-[0_24px_80px_-24px_rgba(15,23,42,0.2)] backdrop-blur">
          {!verificationStep ? (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  First name
                  <input value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-950" />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  Last name
                  <input value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-950" />
                </label>
              </div>

              <label className="block space-y-2 text-sm font-medium text-slate-700">
                Email address
                <input type="email" value={form.emailAddress} onChange={(event) => setForm((current) => ({ ...current, emailAddress: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-950" />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  Password
                  <input type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-950" />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  Confirm password
                  <input type="password" value={form.confirmPassword} onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-950" />
                </label>
              </div>

              {accountType === "Driver" ? (
                <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                    <span>Driver details</span>
                  </label>
                  <label className="space-y-2 text-sm font-medium text-slate-700">
                    License number
                    <input value={form.driver.licenseNumber} onChange={(event) => setForm((current) => ({ ...current, driver: { ...current.driver, licenseNumber: event.target.value } }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-950" />
                  </label>
                  <label className="space-y-2 text-sm font-medium text-slate-700">
                    License category
                    <input value={form.driver.licenseCategory} onChange={(event) => setForm((current) => ({ ...current, driver: { ...current.driver, licenseCategory: event.target.value } }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-950" />
                  </label>
                  <label className="space-y-2 text-sm font-medium text-slate-700">
                    License expiry date
                    <input type="date" value={form.driver.licenseExpiryDate} onChange={(event) => setForm((current) => ({ ...current, driver: { ...current.driver, licenseExpiryDate: event.target.value } }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-950" />
                  </label>
                  <label className="space-y-2 text-sm font-medium text-slate-700">
                    Contact number
                    <input value={form.driver.contactNumber} onChange={(event) => setForm((current) => ({ ...current, driver: { ...current.driver, contactNumber: event.target.value } }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-950" />
                  </label>
                  <label className="space-y-2 text-sm font-medium text-slate-700">
                    Years of experience
                    <input type="number" min="0" value={form.driver.yearsExperience} onChange={(event) => setForm((current) => ({ ...current, driver: { ...current.driver, yearsExperience: event.target.value } }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-950" />
                  </label>
                  <label className="flex items-center gap-3 text-sm font-medium text-slate-700 md:col-span-2">
                    <input type="checkbox" checked={form.driver.hasHeavyVehiclePermit} onChange={(event) => setForm((current) => ({ ...current, driver: { ...current.driver, hasHeavyVehiclePermit: event.target.checked } }))} className="size-4 rounded border-slate-300" />
                    Permit to drive heavy vehicles
                  </label>
                </div>
              ) : null}

              <Button type="button" onClick={startSignup} disabled={loading} className="w-full rounded-2xl py-3 text-base font-semibold">
                {loading ? "Sending verification..." : "Create account"}
              </Button>
              <p className="text-xs leading-5 text-slate-500">
                By continuing, you’ll be created as a pending account until approval. Use the requested role page after sign-up if you registered as an other user.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Verify email</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">Enter the 6-digit code</h2>
                <p className="mt-2 text-sm text-slate-600">We sent a verification code to {form.emailAddress}. Finish verification to continue.</p>
              </div>

              <label className="block space-y-2 text-sm font-medium text-slate-700">
                Verification code
                <input value={code} onChange={(event) => setCode(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 tracking-[0.4em] outline-none focus:border-slate-950" />
              </label>

              <Button type="button" onClick={completeVerification} disabled={loading} className="w-full rounded-2xl py-3 text-base font-semibold">
                {loading ? "Completing..." : "Verify and continue"}
              </Button>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-medium text-slate-900">Approved roles later</p>
                <p className="mt-2">Drivers go to approval. Other users go to a role request page where they can choose a role and submit it for review.</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}