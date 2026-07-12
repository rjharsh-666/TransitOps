import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/rbac";
import { getSessionRole, handleApiError } from "@/lib/api-helpers";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionRole();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const tripId = Number(id);

    if (session.role === "Driver") {
      const trip = await prisma.trip.findUnique({ where: { id: tripId } });
      if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const driverProfile = await prisma.driver.findUnique({ where: { userId: session.userId } });
      if (!driverProfile || trip.driverId !== driverProfile.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      assertRole(session.role, ["Admin", "FleetManager"]);
    }
    let body: any = {};
    try {
      body = await req.json();
    } catch (e) {
      // Empty or invalid body is allowed
    }

    const result = await prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({ where: { id: tripId } });
      if (!trip || trip.status !== "Dispatched") {
        throw Object.assign(new Error("Trip is not Dispatched"), { status: 400 });
      }

      const updatedTrip = await tx.trip.update({
        where: { id: tripId },
        data: {
          status: "Completed",
          completedAt: new Date(),
          actualDistance: body.actualDistance,
          fuelConsumed: body.fuelConsumed,
        },
      });

      await tx.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: "Available", ...(body.odometerReading && { odometer: body.odometerReading }) },
      });
      await tx.driver.update({ where: { id: trip.driverId }, data: { status: "Available" } });

      return updatedTrip;
    });

    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}