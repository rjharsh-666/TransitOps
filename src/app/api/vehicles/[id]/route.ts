import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/rbac";
import { getSessionRole, handleApiError } from "@/lib/api-helpers";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionRole();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    if (session.role === "Driver") {
      const driver = await prisma.driver.findUnique({ where: { userId: session.userId } });
      if (!driver) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      
      const trip = await prisma.trip.findFirst({
        where: {
          vehicleId: Number(id),
          driverId: driver.id
        }
      });
      if (!trip) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    } else {
      assertRole(session.role, ["Admin", "FleetManager"]);
    }

    const vehicle = await prisma.vehicle.findUnique({ where: { id: Number(id) } });
    if (!vehicle) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(vehicle);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionRole();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    assertRole(session.role, ["Admin", "FleetManager"]);

    const { id } = await params;
    const body = await req.json();
    const vehicle = await prisma.vehicle.update({ where: { id: Number(id) }, data: body });
    return NextResponse.json(vehicle);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionRole();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    assertRole(session.role, ["Admin", "FleetManager"]);

    const { id } = await params;
    await prisma.vehicle.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}