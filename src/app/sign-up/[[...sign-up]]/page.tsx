import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_45%),linear-gradient(180deg,_#f8fafc,_#eef2ff)] px-6">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        forceRedirectUrl="/dashboard"
        fallbackRedirectUrl="/dashboard"
        signInForceRedirectUrl="/dashboard"
        signInFallbackRedirectUrl="/dashboard"
      />
    </main>
  );
}