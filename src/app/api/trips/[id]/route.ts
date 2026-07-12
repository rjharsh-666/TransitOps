import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/rbac";
import { getSessionRole, handleApiError } from "@/lib/api-helpers";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionRole();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const trip = await prisma.trip.findUnique({ where: { id: Number(id) }, include: { vehicle: true, driver: true, createdBy: true } });
    if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (session.role === "Driver") {
      if (trip.driver?.userId !== session.userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      assertRole(session.role, ["Admin", "FleetManager"]);
    }

    return NextResponse.json(trip);
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
    const tripId = Number(id);
    const body = await req.json();

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (trip.status !== "Draft") return NextResponse.json({ error: "Only Draft trips can be edited" }, { status: 400 });

    const updated = await prisma.trip.update({ where: { id: tripId }, data: body });
    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err);
  }
}