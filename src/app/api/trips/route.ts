import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/rbac";
import { getSessionRole, handleApiError } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionRole();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? undefined;

    let whereClause: any = { ...(status && { status: status as never }) };

    if (session.role === "Driver") {
      const driver = await prisma.driver.findUnique({ where: { userId: session.userId } });
      if (!driver) {
        return NextResponse.json([]);
      }
      whereClause.driverId = driver.id;
    } else {
      assertRole(session.role, ["Admin", "FleetManager", "FinancialAnalyst", "SafetyOfficer"]);
    }

    const trips = await prisma.trip.findMany({
      where: whereClause,
      include: { vehicle: true, driver: true, createdBy: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(trips);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionRole();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    assertRole(session.role, ["Admin", "FleetManager"]);

    const body = await req.json();
    const { vehicleId, driverId, cargoWeight, plannedDistance, source, destination } = body;

    const vehicle = await prisma.vehicle.findUnique({ where: { id: Number(vehicleId) } });
    const driver = await prisma.driver.findUnique({ where: { id: Number(driverId) } });

    if (!vehicle || vehicle.status !== "Available") {
      return NextResponse.json({ error: "Vehicle is not available" }, { status: 400 });
    }
    if (!driver || driver.status !== "Available" || driver.licenseExpiryDate < new Date()) {
      return NextResponse.json({ error: "Driver is not available or license expired" }, { status: 400 });
    }
    if (Number(cargoWeight) > Number(vehicle.maxLoadCapacity)) {
      return NextResponse.json({ error: `Cargo weight ${cargoWeight}kg exceeds vehicle max load ${vehicle.maxLoadCapacity}kg` }, { status: 400 });
    }

    const trip = await prisma.trip.create({
      data: {
        source,
        destination,
        vehicleId: Number(vehicleId),
        driverId: Number(driverId),
        cargoWeight,
        plannedDistance,
        status: "Draft",
        createdById: session.userId,
      },
    });

    return NextResponse.json(trip, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}