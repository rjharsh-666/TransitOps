import { clerkClient, auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-helpers";

const FINAL_ROLES = ["Admin", "FleetManager", "Driver", "SafetyOfficer", "FinancialAnalyst"] as const;

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { requestedRole?: string };
    if (!body.requestedRole || !FINAL_ROLES.includes(body.requestedRole as (typeof FINAL_ROLES)[number])) {
      return NextResponse.json({ error: "Requested role is required" }, { status: 400 });
    }

    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
    const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || email;

    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        role: "Pending",
        signupStatus: "Pending",
        requestedRole: body.requestedRole,
      },
    });

    await prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email,
        name,
        role: "Pending",
        signupStatus: "Pending",
        requestedRole: body.requestedRole,
      },
      update: {
        email,
        name,
        role: "Pending",
        signupStatus: "Pending",
        requestedRole: body.requestedRole,
      },
    });

    const request = await prisma.roleRequest.upsert({
      where: { userId },
      create: {
        userId,
        requestedRole: body.requestedRole,
        status: "Pending",
      },
      update: {
        requestedRole: body.requestedRole,
        status: "Pending",
        reviewedById: null,
        reviewedAt: null,
        reviewNotes: null,
        approvedRole: null,
      },
    });

    return NextResponse.json(request);
  } catch (error) {
    return handleApiError(error);
  }
}