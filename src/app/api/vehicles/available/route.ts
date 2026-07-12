import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionRole, handleApiError } from "@/lib/api-helpers";

export async function GET() {
  try {
    const session = await getSessionRole();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const vehicles = await prisma.vehicle.findMany({
      where: { status: "Available" },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(vehicles);
  } catch (err) {
    return handleApiError(err);
  }
}