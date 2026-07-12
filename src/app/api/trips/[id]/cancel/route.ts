import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/rbac";
import { getSessionRole, handleApiError } from "@/lib/api-helpers";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionRole();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    assertRole(session.role, ["FleetManager", "Driver"]);

    const { id } = await params;
    const tripId = Number(id);

    const result = await prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({ where: { id: tripId } });
      if (!trip || trip.status !== "Dispatched") {
        throw Object.assign(new Error("Only a Dispatched trip can be cancelled"), { status: 400 });
      }

      const updatedTrip = await tx.trip.update({
        where: { id: tripId },
        data: { status: "Cancelled", cancelledAt: new Date() },
      });
      await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: "Available" } });
      await tx.driver.update({ where: { id: trip.driverId }, data: { status: "Available" } });

      return updatedTrip;
    });

    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}