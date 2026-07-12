import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/rbac";
import { getSessionRole, handleApiError } from "@/lib/api-helpers";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionRole();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    assertRole(session.role, ["Admin", "FleetManager"]);

    const { id } = await params;
    const logId = Number(id);

    const result = await prisma.$transaction(async (tx) => {
      const log = await tx.maintenanceLog.findUnique({ where: { id: logId }, include: { vehicle: true } });
      if (!log || log.status !== "Closed") {
        throw Object.assign(new Error("Maintenance log is not Closed"), { status: 400 });
      }

      const updatedLog = await tx.maintenanceLog.update({
        where: { id: logId },
        data: { status: "Open", endDate: null },
      });

      // Put vehicle back in shop
      if (log.vehicle.status !== "Retired") {
        await tx.vehicle.update({ where: { id: log.vehicleId }, data: { status: "InShop" } });
      }

      return updatedLog;
    });

    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}
