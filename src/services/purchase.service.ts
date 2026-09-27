import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "./audit.service";

export interface PurchaseItemInput {
  productId: string;
  batchNumber: string;
  manufacturingDate?: Date | string;
  expiryDate: Date | string;
  quantity: number;
  unitCost: number;
  proposedSalePrice?: number;
  discountPercent?: number;
  taxPercent?: number;
}

export interface CreatePurchaseInput {
  branchId: string;
  supplierId: string;
  supplierInvoiceNumber?: string;
  purchaseDate?: Date | string;
  dueDate?: Date | string;
  items: PurchaseItemInput[];
  paidAmount?: number;
  notes?: string;
  createdById: string;
}

export async function createPurchase(input: CreatePurchaseInput) {
  if (!input.items || input.items.length === 0) {
    throw new Error("Purchase must contain at least one item.");
  }

  return await prisma.$transaction(async (tx) => {
    const count = await tx.purchase.count();
    const currentYear = new Date().getFullYear();
    const purchaseNumber = `PUR-${currentYear}-${String(count + 1).padStart(6, "0")}`;

    let subTotal = 0;
    const purchaseItemsToCreate: any[] = [];
    const stockMovementsToCreate: any[] = [];

    for (const item of input.items) {
      const lineTotal = item.quantity * item.unitCost;
      subTotal += lineTotal;

      const expDate = typeof item.expiryDate === "string" ? new Date(item.expiryDate) : item.expiryDate;
      const mfgDate = item.manufacturingDate
        ? typeof item.manufacturingDate === "string"
          ? new Date(item.manufacturingDate)
          : item.manufacturingDate
        : null;

      // 1. Upsert or create MedicineBatch
      let batch = await tx.medicineBatch.findUnique({
        where: {
          productId_batchNumber: {
            productId: item.productId,
            batchNumber: item.batchNumber,
          },
        },
      });

      if (batch) {
        batch = await tx.medicineBatch.update({
          where: { id: batch.id },
          data: {
            currentQuantity: batch.currentQuantity + item.quantity,
            costPrice: item.unitCost,
            salePrice: item.proposedSalePrice ?? batch.salePrice,
            expiryDate: expDate,
            status: "ACTIVE",
          },
        });
      } else {
        const prod = await tx.product.findUnique({ where: { id: item.productId } });
        batch = await tx.medicineBatch.create({
          data: {
            productId: item.productId,
            batchNumber: item.batchNumber,
            manufacturingDate: mfgDate,
            expiryDate: expDate,
            costPrice: item.unitCost,
            salePrice: item.proposedSalePrice ?? prod?.salePrice ?? item.unitCost * 1.25,
            initialQuantity: item.quantity,
            currentQuantity: item.quantity,
            supplierId: input.supplierId,
            status: "ACTIVE",
          },
        });
      }

      // 2. Increment ProductStock for branch
      const prodStock = await tx.productStock.findUnique({
        where: {
          productId_branchId: {
            productId: item.productId,
            branchId: input.branchId,
          },
        },
      });

      const prevStock = prodStock?.currentStock ?? 0;
      const newStock = prevStock + item.quantity;

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

      // Also update base purchasePrice on Product catalog
      await tx.product.update({
        where: { id: item.productId },
        data: {
          purchasePrice: item.unitCost,
          salePrice: item.proposedSalePrice ?? undefined,
        },
      });

      purchaseItemsToCreate.push({
        productId: item.productId,
        batchId: batch.id,
        quantity: item.quantity,
        unitCost: item.unitCost,
        discountPercent: item.discountPercent || 0,
        taxPercent: item.taxPercent || 0,
        lineTotal,
      });

      stockMovementsToCreate.push({
        branchId: input.branchId,
        productId: item.productId,
        batchId: batch.id,
        movementType: "PURCHASE",
        quantity: item.quantity,
        previousStock: prevStock,
        newStock,
        referenceType: "PURCHASE_INVOICE",
        referenceId: purchaseNumber,
        userId: input.createdById,
        notes: `Inbound receiving from purchase ${purchaseNumber}`,
      });
    }

    const grandTotal = subTotal;
    const paidAmount = Math.min(input.paidAmount || 0, grandTotal);
    const dueAmount = grandTotal - paidAmount;

    let paymentStatus = "UNPAID";
    if (paidAmount >= grandTotal) {
      paymentStatus = "PAID";
    } else if (paidAmount > 0) {
      paymentStatus = "PARTIAL";
    }

    // 3. Create Purchase Order Record
    const purchase = await tx.purchase.create({
      data: {
        purchaseNumber,
        supplierInvoiceNumber: input.supplierInvoiceNumber,
        branchId: input.branchId,
        supplierId: input.supplierId,
        purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : new Date(),
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        subTotal,
        discountTotal: 0,
        taxTotal: 0,
        grandTotal,
        paidAmount,
        dueAmount,
        paymentStatus,
        status: "RECEIVED",
        notes: input.notes,
        createdById: input.createdById,
        items: {
          create: purchaseItemsToCreate,
        },
      },
      include: {
        items: {
          include: {
            product: true,
            batch: true,
          },
        },
        supplier: true,
      },
    });

    // 4. Create Stock Movement records
    for (const mov of stockMovementsToCreate) {
      await tx.stockMovement.create({
        data: {
          ...mov,
          referenceId: purchase.id,
        },
      });
    }

    // 5. Update Supplier Account & Ledger
    const supplier = await tx.supplier.findUnique({ where: { id: input.supplierId } });
    const newSupplierBalance = (supplier?.currentBalance ?? 0) + dueAmount;

    await tx.supplier.update({
      where: { id: input.supplierId },
      data: { currentBalance: newSupplierBalance },
    });

    await tx.supplierLedger.create({
      data: {
        supplierId: input.supplierId,
        branchId: input.branchId,
        transactionType: "PURCHASE_BILL",
        referenceNumber: purchaseNumber,
        referenceId: purchase.id,
        credit: grandTotal,
        debit: paidAmount,
        runningBalance: newSupplierBalance,
        notes: `Purchase bill ${purchaseNumber} (Total: ${grandTotal}, Paid: ${paidAmount}, Due: ${dueAmount})`,
      },
    });

    // 6. Record Supplier Payment if any paid
    if (paidAmount > 0) {
      const payCount = await tx.supplierPayment.count();
      await tx.supplierPayment.create({
        data: {
          paymentNumber: `SPAY-${currentYear}-${String(payCount + 1).padStart(6, "0")}`,
          supplierId: input.supplierId,
          branchId: input.branchId,
          amount: paidAmount,
          paymentMethod: "BANK_TRANSFER",
          referenceNumber: purchaseNumber,
          notes: `Initial payment on purchase ${purchaseNumber}`,
          paidById: input.createdById,
        },
      });
    }

    return purchase;
  });
}

export async function getPurchases({ page = 1, limit = 20 }: { page?: number; limit?: number }) {
  const [total, purchases] = await Promise.all([
    prisma.purchase.count(),
    prisma.purchase.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { purchaseDate: "desc" },
      include: {
        supplier: true,
        createdBy: true,
        items: {
          include: {
            product: true,
            batch: true,
          },
        },
      },
    }),
  ]);

  return {
    purchases,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
