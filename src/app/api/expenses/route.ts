import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId") || undefined;

    const where: any = {};
    if (categoryId) where.categoryId = categoryId;

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { paidDate: "desc" },
      include: {
        category: true,
        createdBy: true,
      },
    });

    return NextResponse.json({ success: true, expenses });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const count = await prisma.expense.count();
    const currentYear = new Date().getFullYear();
    const expenseNumber = `EXP-${currentYear}-${String(count + 1).padStart(6, "0")}`;

    const expense = await prisma.expense.create({
      data: {
        expenseNumber,
        branchId: session.branchId,
        categoryId: body.categoryId,
        title: body.title,
        description: body.description,
        amount: Number(body.amount),
        paymentMethod: body.paymentMethod || "CASH",
        paidDate: body.paidDate ? new Date(body.paidDate) : new Date(),
        paidTo: body.paidTo,
        createdById: session.id,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json({ success: true, expense }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
