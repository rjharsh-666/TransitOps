import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/rbac";
import { getSessionRole, handleApiError } from "@/lib/api-helpers";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const result = await prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({ where: { id: tripId } });
      if (!trip || trip.status !== "Draft") {
        throw Object.assign(new Error("Trip is not in Draft status"), { status: 400 });
      }

      const vehicle = await tx.vehicle.findUnique({ where: { id: trip.vehicleId } });
      const driver = await tx.driver.findUnique({ where: { id: trip.driverId } });
      if (!vehicle || vehicle.status !== "Available") {
        throw Object.assign(new Error("Vehicle no longer available"), { status: 409 });
      }
      if (!driver || driver.status !== "Available") {
        throw Object.assign(new Error("Driver no longer available"), { status: 409 });
      }

      const updatedTrip = await tx.trip.update({ where: { id: tripId }, data: { status: "Dispatched", dispatchedAt: new Date() } });
      await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: "OnTrip" } });
      await tx.driver.update({ where: { id: trip.driverId }, data: { status: "OnTrip" } });

      return updatedTrip;
    });

    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}