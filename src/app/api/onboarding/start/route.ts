import { clerkClient, auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-helpers";

type OnboardingBody = {
  accountType?: "Driver" | "OtherUser";
  driverApplication?: {
    hasHeavyVehiclePermit?: boolean;
    yearsExperience?: number;
    licenseNumber?: string;
    licenseCategory?: string;
    licenseExpiryDate?: string;
    contactNumber?: string;
  };
};

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as OnboardingBody;
    const accountType = body.accountType;
    if (accountType !== "Driver" && accountType !== "OtherUser") {
      return NextResponse.json({ error: "Account type is required" }, { status: 400 });
    }

    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
    const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || email;

    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        role: "Pending",
        signupType: accountType,
        signupStatus: "Pending",
      },
    });

    await prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email,
        name,
        role: "Pending",
        signupType: accountType,
        signupStatus: "Pending",
      },
      update: {
        email,
        name,
        role: "Pending",
        signupType: accountType,
        signupStatus: "Pending",
      },
    });

    if (accountType === "Driver") {
      const driverApplication = body.driverApplication;
      if (!driverApplication?.licenseNumber || !driverApplication.licenseCategory || !driverApplication.licenseExpiryDate || !driverApplication.contactNumber || typeof driverApplication.yearsExperience !== "number") {
        return NextResponse.json({ error: "Driver details are required" }, { status: 400 });
      }

      await prisma.driverApplication.upsert({
        where: { userId },
        create: {
          userId,
          hasHeavyVehiclePermit: Boolean(driverApplication.hasHeavyVehiclePermit),
          yearsExperience: driverApplication.yearsExperience,
          licenseNumber: driverApplication.licenseNumber,
          licenseCategory: driverApplication.licenseCategory,
          licenseExpiryDate: new Date(driverApplication.licenseExpiryDate),
          contactNumber: driverApplication.contactNumber,
        },
        update: {
          hasHeavyVehiclePermit: Boolean(driverApplication.hasHeavyVehiclePermit),
          yearsExperience: driverApplication.yearsExperience,
          licenseNumber: driverApplication.licenseNumber,
          licenseCategory: driverApplication.licenseCategory,
          licenseExpiryDate: new Date(driverApplication.licenseExpiryDate),
          contactNumber: driverApplication.contactNumber,
          status: "Pending",
          reviewedById: null,
          reviewedAt: null,
          reviewNotes: null,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}