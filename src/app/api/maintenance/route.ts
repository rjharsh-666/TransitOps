import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/rbac";
import { getSessionRole, handleApiError } from "@/lib/api-helpers";

export async function GET() {
  try {
    const session = await getSessionRole();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    assertRole(session.role, ["Admin", "FleetManager"]);
    const logs = await prisma.maintenanceLog.findMany({ include: { vehicle: true }, orderBy: { createdAt: "desc" } });
    return NextResponse.json(logs);
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
    const result = await prisma.$transaction([
      prisma.maintenanceLog.create({
        data: {
          vehicleId: Number(body.vehicleId),
          maintenanceType: body.maintenanceType,
          description: body.description ?? null,
          cost: body.cost ?? 0,
          status: "Open",
          startDate: new Date(body.startDate),
        },
      }),
      prisma.vehicle.update({ where: { id: Number(body.vehicleId) }, data: { status: "InShop" } }),
    ]);

    return NextResponse.json(result[0], { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}