import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-helpers";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const application = await prisma.driverApplication.findUnique({
      where: { userId },
      include: {
        reviewedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(application);
  } catch (error) {
    return handleApiError(error);
  }
}