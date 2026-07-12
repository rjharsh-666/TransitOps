import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/rbac";
import { getSessionRole, handleApiError } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionRole();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const region = searchParams.get("region") ?? undefined;

    const vehicles = await prisma.vehicle.findMany({
      where: {
        ...(type && { type }),
        ...(status && { status: status as never }),
        ...(region && { region }),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(vehicles);
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
    const vehicle = await prisma.vehicle.create({
      data: {
        registrationNumber: body.registrationNumber,
        nameModel: body.nameModel,
        type: body.type,
        maxLoadCapacity: body.maxLoadCapacity,
        odometer: body.odometer ?? 0,
        acquisitionCost: body.acquisitionCost,
        region: body.region ?? null,
        status: "Available",
      },
    });

    return NextResponse.json(vehicle, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}