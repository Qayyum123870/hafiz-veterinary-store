import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "./audit.service";
import { addDays } from "date-fns";

export interface StockAdjustmentItemInput {
  productId: string;
  batchId?: string;
  physicalQuantity: number;
}

export interface CreateStockAdjustmentInput {
  branchId: string;
  reason: "PHYSICAL_COUNT" | "DAMAGED" | "EXPIRED" | "LEAKAGE" | "THEFT" | "OTHER";
  notes?: string;
  createdById: string;
  items: StockAdjustmentItemInput[];
}

export async function createStockAdjustment(input: CreateStockAdjustmentInput) {
  if (!input.items || input.items.length === 0) {
    throw new Error("Adjustment must include at least one item.");
  }

  return await prisma.$transaction(async (tx) => {
    const count = await tx.stockAdjustment.count();
    const currentYear = new Date().getFullYear();
    const adjustmentNumber = `ADJ-${currentYear}-${String(count + 1).padStart(6, "0")}`;

    const adjustmentItemsToCreate: any[] = [];
    const stockMovementsToCreate: any[] = [];

    for (const item of input.items) {
      let systemQuantity = 0;
      let unitCost = 0;

      if (item.batchId) {
        const batch = await tx.medicineBatch.findUnique({ where: { id: item.batchId } });
        if (!batch) throw new Error(`Batch not found.`);
        systemQuantity = batch.currentQuantity;
        unitCost = batch.costPrice;

        const difference = item.physicalQuantity - systemQuantity;
        const newBatchQty = Math.max(0, item.physicalQuantity);

        await tx.medicineBatch.update({
          where: { id: item.batchId },
          data: {
            currentQuantity: newBatchQty,
            status: newBatchQty === 0 ? "DEPLETED" : "ACTIVE",
          },
        });

        // Update product aggregate stock
        const prodStock = await tx.productStock.findUnique({
          where: {
            productId_branchId: {
              productId: item.productId,
              branchId: input.branchId,
            },
          },
        });

        const prevStock = prodStock?.currentStock ?? 0;
        const newStock = Math.max(0, prevStock + difference);

        await tx.productStock.upsert({
          where: {
            productId_branchId: {
              productId: item.productId,
              branchId: input.branchId,
            },
          },
          update: { currentStock: newStock },
          create: {
            productId: item.productId,
            branchId: input.branchId,
            currentStock: newStock,
          },
        });

        adjustmentItemsToCreate.push({
          productId: item.productId,
          batchId: item.batchId,
          systemQuantity,
          physicalQuantity: item.physicalQuantity,
          differenceQuantity: difference,
          unitCost,
        });

        stockMovementsToCreate.push({
          branchId: input.branchId,
          productId: item.productId,
          batchId: item.batchId,
          movementType: difference >= 0 ? "ADJUSTMENT_ADD" : "ADJUSTMENT_DEDUCT",
          quantity: difference,
          previousStock: prevStock,
          newStock,
          referenceType: "ADJUSTMENT_DOC",
          referenceId: adjustmentNumber,
          userId: input.createdById,
          notes: `Stock adjustment [${input.reason}]: ${input.notes || ""}`,
        });
      }
    }

    const adjustment = await tx.stockAdjustment.create({
      data: {
        adjustmentNumber,
        branchId: input.branchId,
        reason: input.reason,
        status: "APPROVED",
        createdById: input.createdById,
        notes: input.notes,
        items: {
          create: adjustmentItemsToCreate,
        },
      },
      include: {
        items: {
          include: {
            product: true,
            batch: true,
          },
        },
        createdBy: true,
      },
    });

    for (const mov of stockMovementsToCreate) {
      await tx.stockMovement.create({
        data: {
          ...mov,
          referenceId: adjustment.id,
        },
      });
    }

    return adjustment;
  });
}

export async function getStockMovements({
  productId,
  page = 1,
  limit = 25,
}: {
  productId?: string;
  page?: number;
  limit?: number;
}) {
  const where: any = {};
  if (productId) where.productId = productId;

  const [total, movements] = await Promise.all([
    prisma.stockMovement.count({ where }),
    prisma.stockMovement.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        product: true,
        batch: true,
        user: true,
      },
    }),
  ]);

  return {
    movements,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getExpiryAnalytics() {
  const now = new Date();
  const in30Days = addDays(now, 30);
  const in60Days = addDays(now, 60);
  const in90Days = addDays(now, 90);

  const [expired, expiring30, expiring60, expiring90] = await Promise.all([
    prisma.medicineBatch.findMany({
      where: {
        currentQuantity: { gt: 0 },
        expiryDate: { lte: now },
      },
      include: { product: true, supplier: true },
      orderBy: { expiryDate: "asc" },
    }),
    prisma.medicineBatch.findMany({
      where: {
        currentQuantity: { gt: 0 },
        expiryDate: { gt: now, lte: in30Days },
      },
      include: { product: true, supplier: true },
      orderBy: { expiryDate: "asc" },
    }),
    prisma.medicineBatch.findMany({
      where: {
        currentQuantity: { gt: 0 },
        expiryDate: { gt: in30Days, lte: in60Days },
      },
      include: { product: true, supplier: true },
      orderBy: { expiryDate: "asc" },
    }),
    prisma.medicineBatch.findMany({
      where: {
        currentQuantity: { gt: 0 },
        expiryDate: { gt: in60Days, lte: in90Days },
      },
      include: { product: true, supplier: true },
      orderBy: { expiryDate: "asc" },
    }),
  ]);

  return {
    expired,
    expiring30,
    expiring60,
    expiring90,
    summary: {
      expiredCount: expired.length,
      expiring30Count: expiring30.length,
      expiring60Count: expiring60.length,
      expiring90Count: expiring90.length,
    },
  };
}
