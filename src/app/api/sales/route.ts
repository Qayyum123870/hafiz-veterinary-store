import { NextRequest, NextResponse } from "next/server";
import { createPOSSale } from "@/services/sale.service";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const paymentStatus = searchParams.get("paymentStatus") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const where: any = {};
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search } },
        { customer: { name: { contains: search } } },
        { customer: { phone: { contains: search } } },
      ];
    }
    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    const [total, sales] = await Promise.all([
      prisma.sale.count({ where }),
      prisma.sale.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          customer: true,
          pet: true,
          cashier: true,
          items: {
            include: {
              product: true,
              batch: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      sales,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session, "sales.pos_create")) {
      return NextResponse.json({ success: false, error: "Unauthorized to process sales." }, { status: 403 });
    }

    const body = await req.json();

    // Check cashier discount limit
    if (body.discountType === "PERCENTAGE" && body.discountValue > 5) {
      if (!hasPermission(session, "sales.apply_custom_discount")) {
        return NextResponse.json(
          { success: false, error: "Cashier discount limit exceeded (Max 5%). Manager approval required." },
          { status: 403 }
        );
      }
    }

    const sale = await createPOSSale({
      branchId: session.branchId,
      cashierId: session.id,
      customerId: body.customerId || undefined,
      petId: body.petId || undefined,
      cashRegisterId: body.cashRegisterId || undefined,
      items: body.items,
      discountType: body.discountType || "FIXED",
      discountValue: body.discountValue || 0,
      paymentMethod: body.paymentMethod || "CASH",
      paidAmount: Number(body.paidAmount || 0),
      notes: body.notes,
    });

    return NextResponse.json({ success: true, sale }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
