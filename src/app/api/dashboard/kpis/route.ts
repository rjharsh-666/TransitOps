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

    // Calculate weekly trend for the last 8 weeks
    const weeklyTrend: number[] = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);

      const [vCount, tCount] = await Promise.all([
        prisma.vehicle.count({
          where: {
            createdAt: { lte: weekEnd },
            status: { not: "Retired" },
          },
        }),
        prisma.trip.count({
          where: {
            createdAt: { gte: weekStart, lte: weekEnd },
            status: { in: ["Dispatched", "Completed"] },
          },
        }),
      ]);

      const weekUtil = vCount > 0 ? Math.round((tCount / vCount) * 100) : 0;
      weeklyTrend.push(Math.min(weekUtil, 100));
    }

    return NextResponse.json({
      activeVehicles: totalVehicles,
      availableVehicles,
      vehiclesInMaintenance: inShopVehicles,
      activeTrips,
      pendingTrips,
      driversOnDuty,
      fleetUtilizationPct: utilization,
      weeklyTrend,
    });
  } catch (err) {
    return handleApiError(err);
  }
}