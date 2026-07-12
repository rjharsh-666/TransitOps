import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionRole, handleApiError } from "@/lib/api-helpers";

export async function GET() {
  try {
    const session = await getSessionRole();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [totalVehicles, availableVehicles, inShopVehicles, activeTrips, pendingTrips, driversOnDuty] = await Promise.all([
      prisma.vehicle.count({ where: { status: { not: "Retired" } } }),
      prisma.vehicle.count({ where: { status: "Available" } }),
      prisma.vehicle.count({ where: { status: "InShop" } }),
      prisma.trip.count({ where: { status: "Dispatched" } }),
      prisma.trip.count({ where: { status: "Draft" } }),
      prisma.driver.count({ where: { status: "OnTrip" } }),
    ]);

    const utilization = totalVehicles > 0 ? Math.round((activeTrips / totalVehicles) * 100) : 0;

    return NextResponse.json({
      activeVehicles: totalVehicles,
      availableVehicles,
      vehiclesInMaintenance: inShopVehicles,
      activeTrips,
      pendingTrips,
      driversOnDuty,
      fleetUtilizationPct: utilization,
    });
  } catch (err) {
    return handleApiError(err);
  }
}