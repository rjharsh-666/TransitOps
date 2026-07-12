import { NextResponse } from "next/server";
import { assertRole } from "@/lib/rbac";
import { getSessionRole, handleApiError } from "@/lib/api-helpers";
import { syncClerkUsersToDatabase } from "@/lib/admin-sync";

export async function POST() {
  try {
    const session = await getSessionRole();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    assertRole(session.role, ["Admin", "FleetManager"]);

    const result = await syncClerkUsersToDatabase();

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}