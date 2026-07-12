import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionRole, handleApiError } from "@/lib/api-helpers";

export async function GET() {
  try {
    const session = await getSessionRole();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const vehicles = await prisma.vehicle.findMany({
      include: { fuelLogs: true, maintenanceLogs: true, expenses: true, trips: true },
    });

    const report = vehicles.map((vehicle) => {
      const totalFuelLiters = vehicle.fuelLogs.reduce((sum, log) => sum + Number(log.liters), 0);
      const totalFuelCost = vehicle.fuelLogs.reduce((sum, log) => sum + Number(log.cost), 0);
      const totalMaintenanceCost = vehicle.maintenanceLogs.reduce((sum, log) => sum + Number(log.cost), 0);
      const totalExpenseCost = vehicle.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
      const totalDistance = vehicle.trips.reduce((sum, trip) => sum + Number(trip.actualDistance ?? 0), 0);

      const fuelEfficiency = totalFuelLiters > 0 ? totalDistance / totalFuelLiters : 0;
      const operationalCost = totalFuelCost + totalMaintenanceCost + totalExpenseCost;
      const revenue = vehicle.trips.reduce((sum, trip) => sum + Number(trip.revenue ?? 0), 0);
      const roi = Number(vehicle.acquisitionCost) > 0 ? (revenue - operationalCost) / Number(vehicle.acquisitionCost) : 0;

      return {
        vehicleId: vehicle.id,
        registrationNumber: vehicle.registrationNumber,
        fuelEfficiency: Number(fuelEfficiency.toFixed(2)),
        operationalCost: Number(operationalCost.toFixed(2)),
        totalDistance,
        roi: Number(roi.toFixed(3)),
      };
    });

    return NextResponse.json(report);
  } catch (err) {
    return handleApiError(err);
  }
}