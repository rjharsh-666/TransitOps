import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/rbac";
import { getSessionRole, handleApiError } from "@/lib/api-helpers";

export async function GET() {
  try {
    const session = await getSessionRole();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const drivers = await prisma.driver.findMany({ include: { user: true }, orderBy: { createdAt: "desc" } });
    return NextResponse.json(drivers);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionRole();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    assertRole(session.role, ["FleetManager"]);

    const body = await req.json();
    const driver = await prisma.driver.create({
      data: {
        userId: body.userId ?? null,
        name: body.name,
        licenseNumber: body.licenseNumber,
        licenseCategory: body.licenseCategory,
        licenseExpiryDate: new Date(body.licenseExpiryDate),
        contactNumber: body.contactNumber,
        status: body.status ?? "Available",
      },
    });
    return NextResponse.json(driver, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}