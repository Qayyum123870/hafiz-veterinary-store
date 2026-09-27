import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;

    const where: any = { deletedAt: null };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { companyName: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, suppliers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const count = await prisma.supplier.count();
    const supplierNumber = `SUP-${String(count + 1).padStart(6, "0")}`;

    const supplier = await prisma.supplier.create({
      data: {
        supplierNumber,
        name: body.name,
        companyName: body.companyName,
        contactPerson: body.contactPerson,
        phone: body.phone,
        whatsapp: body.whatsapp || body.phone,
        email: body.email,
        address: body.address,
        city: body.city || "Lahore",
        paymentTermsDays: Number(body.paymentTermsDays || 30),
        notes: body.notes,
      },
    });

    return NextResponse.json({ success: true, supplier }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
