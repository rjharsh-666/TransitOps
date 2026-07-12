import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/rbac";
import { getSessionRole, handleApiError } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionRole();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const vehicleId = searchParams.get("vehicleId");

    const logs = await prisma.fuelLog.findMany({
      where: { ...(vehicleId && { vehicleId: Number(vehicleId) }) },
      include: { vehicle: true, trip: true },
      orderBy: { logDate: "desc" },
    });
    return NextResponse.json(logs);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionRole();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    assertRole(session.role, ["FleetManager", "FinancialAnalyst"]);

    const body = await req.json();
    const log = await prisma.fuelLog.create({
      data: {
        vehicleId: Number(body.vehicleId),
        tripId: body.tripId ? Number(body.tripId) : null,
        liters: body.liters,
        cost: body.cost,
        logDate: new Date(body.logDate),
        odometerReading: body.odometerReading ?? null,
      },
    });
    return NextResponse.json(log, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}