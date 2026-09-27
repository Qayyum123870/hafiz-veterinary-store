import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { logAuditEvent } from "@/services/audit.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId") || undefined;
    const status = searchParams.get("status") || undefined;

    const where: any = {};
    if (productId) where.productId = productId;
    if (status) where.status = status;

    const batches = await prisma.medicineBatch.findMany({
      where,
      orderBy: { expiryDate: "asc" },
      include: {
        product: true,
        supplier: true,
      },
    });

    return NextResponse.json({ success: true, batches });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session, "products.create_update")) {
      return NextResponse.json({ success: false, error: "Unauthorized access." }, { status: 403 });
    }

    const body = await req.json();
    const { productId, batchNumber, expiryDate, quantity, costPrice, salePrice, supplierId } = body;

    if (!productId || !batchNumber || !expiryDate || !quantity || Number(quantity) <= 0) {
      return NextResponse.json(
        { success: false, error: "Product, Batch Number, Expiry Date, and positive Quantity are required." },
        { status: 400 }
      );
    }

    const qty = Number(quantity);
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ success: false, error: "Product not found." }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Check if batchNumber already exists for this product
      let batch = await tx.medicineBatch.findUnique({
        where: {
          productId_batchNumber: {
            productId,
            batchNumber: batchNumber.trim(),
          },
        },
      });

      if (batch) {
        // Increment quantity of existing batch
        batch = await tx.medicineBatch.update({
          where: { id: batch.id },
          data: {
            currentQuantity: batch.currentQuantity + qty,
            expiryDate: new Date(expiryDate),
            costPrice: costPrice !== undefined ? Number(costPrice) : batch.costPrice,
            salePrice: salePrice !== undefined ? Number(salePrice) : batch.salePrice,
            status: "ACTIVE",
          },
        });
      } else {
        // Create new batch
        batch = await tx.medicineBatch.create({
          data: {
            productId,
            batchNumber: batchNumber.trim(),
            expiryDate: new Date(expiryDate),
            costPrice: costPrice !== undefined ? Number(costPrice) : product.purchasePrice,
            salePrice: salePrice !== undefined ? Number(salePrice) : product.salePrice,
            initialQuantity: qty,
            currentQuantity: qty,
            supplierId: supplierId || null,
            status: "ACTIVE",
          },
        });
      }

      // Update aggregate product stock
      const prodStock = await tx.productStock.findUnique({
        where: {
          productId_branchId: {
            productId,
            branchId: session.branchId,
          },
        },
      });

      const prevStock = prodStock?.currentStock ?? 0;
      const newStock = prevStock + qty;

      await tx.productStock.upsert({
        where: {
          productId_branchId: {
            productId,
            branchId: session.branchId,
          },
        },
        update: { currentStock: newStock },
        create: {
          productId,
          branchId: session.branchId,
          currentStock: newStock,
        },
      });

      // Log stock movement
      await tx.stockMovement.create({
        data: {
          branchId: session.branchId,
          productId,
          batchId: batch.id,
          movementType: "ADJUSTMENT_ADD",
          quantity: qty,
          previousStock: prevStock,
          newStock,
          referenceType: "BATCH_STOCK_IN",
          referenceId: batch.batchNumber,
          userId: session.id,
          notes: `Added ${qty} units to batch ${batch.batchNumber}`,
        },
      });

      return batch;
    });

    await logAuditEvent({
      userId: session.id,
      branchId: session.branchId,
      action: "STOCK_ADDED",
      entity: "MedicineBatch",
      entityId: result.id,
      newValues: { batchNumber, quantity: qty, product: product.name },
    });

    return NextResponse.json({ success: true, batch: result }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
