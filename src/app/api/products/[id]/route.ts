import { NextRequest, NextResponse } from "next/server";
import { getProductById, softDeleteProduct } from "@/services/product.service";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const product = await getProductById(id);
    if (!product) {
      return NextResponse.json({ success: false, error: "Product not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session, "products.create_update")) {
      return NextResponse.json({ success: false, error: "Unauthorized access." }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: body.name,
        genericName: body.genericName,
        imageUrl: body.imageUrl !== undefined ? body.imageUrl : undefined,
        categoryId: body.categoryId || undefined,
        unit: body.unit || undefined,
        salePrice: body.salePrice !== undefined ? Number(body.salePrice) : undefined,
        purchasePrice: body.purchasePrice !== undefined ? Number(body.purchasePrice) : undefined,
        wholesalePrice: body.wholesalePrice !== undefined ? Number(body.wholesalePrice) : undefined,
        minStockThreshold: body.minStockThreshold !== undefined ? Number(body.minStockThreshold) : undefined,
        reorderLevel: body.reorderLevel !== undefined ? Number(body.reorderLevel) : undefined,
        prescriptionRequired: body.prescriptionRequired,
      },
    });

    if (body.medicineDetails) {
      await prisma.medicineDetail.upsert({
        where: { productId: id },
        update: body.medicineDetails,
        create: { productId: id, ...body.medicineDetails },
      });
    }

    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session, "products.delete")) {
      return NextResponse.json({ success: false, error: "Unauthorized access." }, { status: 403 });
    }

    const { id } = await params;
    const result = await softDeleteProduct(id, session.id, session.branchId);

    return NextResponse.json({ success: true, product: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
