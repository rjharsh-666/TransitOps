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
    assertRole(session.role, ["Admin"]);

    const { id } = await params;
    const body = await req.json() as { action?: "approve" | "deny"; reviewNotes?: string };
    const application = await prisma.driverApplication.findUnique({ where: { id: Number(id) }, include: { user: true } });

    if (!application) {
      return NextResponse.json({ error: "Driver application not found" }, { status: 404 });
    }

    const client = await clerkClient();

    if (body.action === "approve") {
      await prisma.$transaction(async (tx) => {
        await tx.driverApplication.update({
          where: { id: application.id },
          data: {
            status: "Approved",
            reviewedById: session.userId,
            reviewedAt: new Date(),
            reviewNotes: body.reviewNotes ?? null,
          },
        });

        await tx.user.update({
          where: { id: application.userId },
          data: {
            role: "Driver",
            signupType: "Driver",
            signupStatus: "Approved",
            requestedRole: "Driver",
          },
        });

        await tx.driver.upsert({
          where: { userId: application.userId },
          create: {
            userId: application.userId,
            name: application.user.name ?? application.user.email,
            licenseNumber: application.licenseNumber,
            licenseCategory: application.licenseCategory,
            licenseExpiryDate: application.licenseExpiryDate,
            contactNumber: application.contactNumber,
            hasHeavyVehiclePermit: application.hasHeavyVehiclePermit,
            yearsExperience: application.yearsExperience,
          },
          update: {
            name: application.user.name ?? application.user.email,
            licenseNumber: application.licenseNumber,
            licenseCategory: application.licenseCategory,
            licenseExpiryDate: application.licenseExpiryDate,
            contactNumber: application.contactNumber,
            hasHeavyVehiclePermit: application.hasHeavyVehiclePermit,
            yearsExperience: application.yearsExperience,
          },
        });
      });

      await client.users.updateUserMetadata(application.userId, {
        publicMetadata: {
          role: "Driver",
          signupType: "Driver",
          signupStatus: "Approved",
        },
      });

      return NextResponse.json({ ok: true, status: "Approved" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.driverApplication.update({
        where: { id: application.id },
        data: {
          status: "Denied",
          reviewedById: session.userId,
          reviewedAt: new Date(),
          reviewNotes: body.reviewNotes ?? null,
        },
      });

      await tx.user.update({
        where: { id: application.userId },
        data: {
          role: "Pending",
          signupStatus: "Denied",
        },
      });
    });

    await client.users.updateUserMetadata(application.userId, {
      publicMetadata: {
        role: "Pending",
        signupType: "Driver",
        signupStatus: "Denied",
      },
    });

    return NextResponse.json({ ok: true, status: "Denied" });
  } catch (error) {
    return handleApiError(error);
  }
}