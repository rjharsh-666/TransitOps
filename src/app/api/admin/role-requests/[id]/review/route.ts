import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertRole, type Role } from "@/lib/rbac";
import { getSessionRole, handleApiError } from "@/lib/api-helpers";

type FinalRole = Exclude<Role, "Pending">;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionRole();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    assertRole(session.role, ["Admin", "FleetManager"]);

    const { id } = await params;
    const body = await req.json() as { action?: "approve" | "deny"; approvedRole?: FinalRole; reviewNotes?: string };
    const request = await prisma.roleRequest.findUnique({ where: { id: Number(id) }, include: { user: true } });

    if (!request) {
      return NextResponse.json({ error: "Role request not found" }, { status: 404 });
    }

    const client = await clerkClient();

    if (body.action === "approve") {
      const approvedRole = body.approvedRole ?? (request.requestedRole as FinalRole);

      await prisma.$transaction(async (tx) => {
        await tx.roleRequest.update({
          where: { id: request.id },
          data: {
            status: "Approved",
            approvedRole,
            reviewedById: session.userId,
            reviewedAt: new Date(),
            reviewNotes: body.reviewNotes ?? null,
          },
        });

        await tx.user.update({
          where: { id: request.userId },
          data: {
            role: approvedRole,
            signupStatus: "Approved",
            requestedRole: approvedRole,
          },
        });
      });

      await client.users.updateUserMetadata(request.userId, {
        publicMetadata: {
          role: approvedRole,
          signupStatus: "Approved",
          signupType: request.user.signupType ?? "OtherUser",
          requestedRole: approvedRole,
        },
      });

      return NextResponse.json({ ok: true, status: "Approved", role: approvedRole });
    }

    await prisma.$transaction(async (tx) => {
      await tx.roleRequest.update({
        where: { id: request.id },
        data: {
          status: "Denied",
          reviewedById: session.userId,
          reviewedAt: new Date(),
          reviewNotes: body.reviewNotes ?? null,
        },
      });

      await tx.user.update({
        where: { id: request.userId },
        data: {
          role: "Pending",
          signupStatus: "Denied",
        },
      });
    });

    await client.users.updateUserMetadata(request.userId, {
      publicMetadata: {
        role: "Pending",
        signupType: request.user.signupType ?? "OtherUser",
        signupStatus: "Denied",
        requestedRole: request.requestedRole,
      },
    });

    return NextResponse.json({ ok: true, status: "Denied" });
  } catch (error) {
    return handleApiError(error);
  }
}