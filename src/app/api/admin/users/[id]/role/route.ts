import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertRole, type Role } from "@/lib/rbac";
import { getSessionRole, handleApiError } from "@/lib/api-helpers";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionRole();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    assertRole(session.role, ["Admin", "FleetManager"]);

    const { id } = await params;
    const body = await req.json();
    const role = body.role as Role | undefined;

    if (!role) {
      return NextResponse.json({ error: "Role is required" }, { status: 400 });
    }

    const client = await clerkClient();
    await client.users.updateUserMetadata(id, {
      publicMetadata: {
        role,
        signupStatus: role === "Pending" ? "Pending" : "Approved",
        requestedRole: role === "Pending" ? undefined : role,
      },
    });

    const clerkUser = await client.users.getUser(id);
    const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
    const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || email;

    await prisma.user.upsert({
      where: { id },
      create: {
        id,
        email,
        name,
        role,
        signupStatus: role === "Pending" ? "Pending" : "Approved",
        requestedRole: role === "Pending" ? null : role,
      },
      update: {
        email,
        name,
        role,
        signupStatus: role === "Pending" ? "Pending" : "Approved",
        requestedRole: role === "Pending" ? null : role,
      },
    });

    return NextResponse.json({ ok: true, role });
  } catch (error) {
    return handleApiError(error);
  }
}