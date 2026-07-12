import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/rbac";
import { getSessionRole, handleApiError } from "@/lib/api-helpers";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const driver = await prisma.driver.findUnique({ where: { id: Number(id) }, include: { user: true } });
    if (!driver) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(driver);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionRole();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    assertRole(session.role, ["FleetManager"]);

    const { id } = await params;
    const body = await req.json();
    const driver = await prisma.driver.update({
      where: { id: Number(id) },
      data: {
        ...body,
        licenseExpiryDate: body.licenseExpiryDate ? new Date(body.licenseExpiryDate) : undefined,
      },
    });
    return NextResponse.json(driver);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionRole();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    assertRole(session.role, ["FleetManager"]);

    const { id } = await params;
    await prisma.driver.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}