import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/rbac";
import { getSessionRole, handleApiError } from "@/lib/api-helpers";

export async function GET() {
  try {
    const session = await getSessionRole();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    assertRole(session.role, ["Admin", "FleetManager"]);

    const applications = await prisma.driverApplication.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, email: true, name: true, role: true, signupType: true, signupStatus: true } },
      },
    });

    return NextResponse.json(applications);
  } catch (error) {
    return handleApiError(error);
  }
}