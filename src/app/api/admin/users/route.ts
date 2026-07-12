import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/rbac";
import { getSessionRole, handleApiError } from "@/lib/api-helpers";
import { syncClerkUsersToDatabase } from "@/lib/admin-sync";

export async function GET() {
  try {
    const session = await getSessionRole();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    assertRole(session.role, ["Admin"]);

    await syncClerkUsersToDatabase();

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { driver: true },
    });

    return NextResponse.json(users);
  } catch (error) {
    return handleApiError(error);
  }
}