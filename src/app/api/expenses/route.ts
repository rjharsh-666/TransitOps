import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/rbac";
import { getSessionRole, handleApiError } from "@/lib/api-helpers";

export async function GET() {
  try {
    const session = await getSessionRole();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    assertRole(session.role, ["Admin", "FinancialAnalyst"]);
    const expenses = await prisma.expense.findMany({ include: { vehicle: true, trip: true }, orderBy: { expenseDate: "desc" } });
    return NextResponse.json(expenses);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionRole();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    assertRole(session.role, ["Admin", "FinancialAnalyst"]);

    const body = await req.json();
    const expense = await prisma.expense.create({
      data: {
        vehicleId: Number(body.vehicleId),
        tripId: body.tripId ? Number(body.tripId) : null,
        expenseType: body.expenseType,
        amount: body.amount,
        expenseDate: new Date(body.expenseDate),
        description: body.description ?? null,
      },
    });
    return NextResponse.json(expense, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}