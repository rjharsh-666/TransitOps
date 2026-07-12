import { clerkClient, auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/rbac";

export const ADMIN_BOOTSTRAP_EMAILS = (process.env.ADMIN_BOOTSTRAP_EMAILS ?? "rajharsh437@gmail.com")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export async function getSessionRole(): Promise<{ userId: string; role: Role } | null> {
  const { userId, sessionClaims } = await auth();
  if (!userId) return null;

  const sessionRole = (sessionClaims?.publicMetadata as { role?: Role } | undefined)?.role;
  if (sessionRole) {
    return { userId, role: sessionRole };
  }

  const existingUser = await prisma.user.findUnique({ where: { id: userId } });
  if (existingUser?.role) {
    return { userId, role: existingUser.role as Role };
  }

  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);
  const clerkEmail = clerkUser.emailAddresses[0]?.emailAddress?.toLowerCase() ?? "";
  const bootstrapAdmin = ADMIN_BOOTSTRAP_EMAILS.includes(clerkEmail);
  const clerkRole = (clerkUser.publicMetadata?.role as Role | undefined) ?? (bootstrapAdmin ? "FleetManager" : undefined);
  if (!clerkRole) return null;

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || email;

  if (bootstrapAdmin && clerkUser.publicMetadata?.role !== "FleetManager") {
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { role: "FleetManager" },
    });
  }

  await prisma.user.upsert({
    where: { id: userId },
    create: { id: userId, email, name, role: clerkRole },
    update: { email, name, role: clerkRole },
  });

  return { userId, role: clerkRole };
}

export function handleApiError(err: unknown) {
  console.error(err);
  const status = (err as { status?: number })?.status ?? 500;

  if ((err as { code?: string })?.code === "P2002") {
    return NextResponse.json({ error: "Duplicate value violates a unique constraint" }, { status: 409 });
  }

  const message = err instanceof Error ? err.message : "Internal server error";
  return NextResponse.json({ error: message }, { status });
}