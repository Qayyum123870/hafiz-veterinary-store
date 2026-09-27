import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;

    const where: any = { deletedAt: null };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { customerNumber: { contains: search } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        pets: {
          include: { species: true },
        },
      },
    });

    return NextResponse.json({ success: true, customers });
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
    const count = await prisma.customer.count();
    const customerNumber = `CUS-${String(count + 1).padStart(6, "0")}`;

    const customer = await prisma.customer.create({
      data: {
        customerNumber,
        name: body.name,
        phone: body.phone,
        whatsapp: body.whatsapp || body.phone,
        email: body.email,
        address: body.address,
        city: body.city || "Sahiwal",
        creditLimit: Number(body.creditLimit || 50000),
        notes: body.notes,
      },
    });

    return NextResponse.json({ success: true, customer }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
