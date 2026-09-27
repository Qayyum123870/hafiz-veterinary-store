import { prisma } from "@/lib/prisma";
import { allocateStockFEFO } from "@/lib/calculations";
import { logAuditEvent } from "./audit.service";

export interface POSSaleItemInput {
  productId: string;
  quantity: number;
  unitPrice?: number;
  discount?: number;
  petId?: string;
  batchId?: string; // Optional manual batch selection; if omitted, Auto-FEFO takes over
}

export interface CreateSaleInput {
  branchId: string;
  cashierId: string;
  customerId?: string;
  petId?: string;
  cashRegisterId?: string;
  items: POSSaleItemInput[];
  discountType?: "FIXED" | "PERCENTAGE";
  discountValue?: number;
  paymentMethod: "CASH" | "CREDIT" | "CARD" | "JAZZCASH" | "EASYPAISA" | "SPLIT";
  paidAmount: number;
  notes?: string;
}

export async function createPOSSale(input: CreateSaleInput) {
  if (!input.items || input.items.length === 0) {
    throw new Error("Sale must contain at least one item.");
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Generate unique sequential Invoice Number
    const count = await tx.sale.count();
    const currentYear = new Date().getFullYear();
    const invoiceNumber = `INV-${currentYear}-${String(count + 1).padStart(6, "0")}`;

    let subTotal = 0;
    let totalCOGS = 0;
    const saleItemsToCreate: any[] = [];
    const stockMovementsToCreate: any[] = [];

    // 2. Process each item and apply FEFO or specified batch
    for (const item of input.items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
        include: {
          batches: {
            where: {
              currentQuantity: { gt: 0 },
              status: "ACTIVE",
            },
            orderBy: { expiryDate: "asc" },
          },
        },
      });

      if (!product || product.deletedAt) {
        throw new Error(`Product [ID: ${item.productId}] not found or inactive.`);
      }

      const unitPrice = item.unitPrice ?? product.salePrice;
      let allocatedBatches: {
        batchId: string;
        quantityToDeduct: number;
        unitCost: number;
      }[] = [];

      if (item.batchId) {
        // Manual batch selection
        const batch = product.batches.find((b) => b.id === item.batchId);
        if (!batch) {
          throw new Error(`Specified batch not found or out of stock for product ${product.name}.`);
        }
        if (new Date(batch.expiryDate) < new Date()) {
          throw new Error(`Batch ${batch.batchNumber} has expired and cannot be dispensed.`);
        }
        if (batch.currentQuantity < item.quantity) {
          throw new Error(
            `Insufficient stock in batch ${batch.batchNumber}. Available: ${batch.currentQuantity}, Requested: ${item.quantity}`
          );
        }
        allocatedBatches.push({
          batchId: batch.id,
          quantityToDeduct: item.quantity,
          unitCost: batch.costPrice,
        });
      } else {
        // Automatic FEFO Allocation
        const fefoResult = allocateStockFEFO(product.batches, item.quantity);
        allocatedBatches = fefoResult.allocations.map((a) => ({
          batchId: a.batchId,
          quantityToDeduct: a.quantityToDeduct,
          unitCost: a.unitCost,
        }));
      }

      // Deduct from batches and record items
      for (const alloc of allocatedBatches) {
        const lineSubtotal = alloc.quantityToDeduct * unitPrice;
        const lineDiscount = item.discount ? (item.discount * alloc.quantityToDeduct) / item.quantity : 0;
        const lineTotal = lineSubtotal - lineDiscount;
        const lineCost = alloc.quantityToDeduct * alloc.unitCost;
        const lineProfit = lineTotal - lineCost;

        subTotal += lineSubtotal;
        totalCOGS += lineCost;

        // Fetch current batch for movement records
        const currentBatch = await tx.medicineBatch.findUnique({
          where: { id: alloc.batchId },
        });

        if (!currentBatch || currentBatch.currentQuantity < alloc.quantityToDeduct) {
          throw new Error(`Concurrent stock change: insufficient quantity in batch.`);
        }

        const newBatchQty = currentBatch.currentQuantity - alloc.quantityToDeduct;

        // Update Batch quantity
        await tx.medicineBatch.update({
          where: { id: alloc.batchId },
          data: {
            currentQuantity: newBatchQty,
            status: newBatchQty === 0 ? "DEPLETED" : "ACTIVE",
          },
        });

        // Update Aggregate ProductStock
        const prodStock = await tx.productStock.findUnique({
          where: {
            productId_branchId: {
              productId: product.id,
              branchId: input.branchId,
            },
          },
        });

        const prevStock = prodStock?.currentStock ?? 0;
        const newStock = Math.max(0, prevStock - alloc.quantityToDeduct);

        await tx.productStock.upsert({
          where: {
            productId_branchId: {
              productId: product.id,
              branchId: input.branchId,
            },
          },
          update: { currentStock: newStock },
          create: {
            productId: product.id,
            branchId: input.branchId,
            currentStock: newStock,
          },
        });

        saleItemsToCreate.push({
          productId: product.id,
          batchId: alloc.batchId,
          petId: item.petId || input.petId,
          quantity: alloc.quantityToDeduct,
          unitPrice,
          unitCost: alloc.unitCost,
          discount: lineDiscount,
          tax: 0,
          lineTotal,
          lineProfit,
        });

        stockMovementsToCreate.push({
          branchId: input.branchId,
          productId: product.id,
          batchId: alloc.batchId,
          movementType: "SALE",
          quantity: -alloc.quantityToDeduct,
          previousStock: prevStock,
          newStock,
          referenceType: "SALE_INVOICE",
          referenceId: invoiceNumber,
          userId: input.cashierId,
          notes: `POS sale checkout for invoice ${invoiceNumber}`,
        });
      }
    }

    // 3. Compute Invoice Discount and Grand Totals
    let discountTotal = 0;
    if (input.discountValue && input.discountValue > 0) {
      if (input.discountType === "PERCENTAGE") {
        discountTotal = (subTotal * input.discountValue) / 100;
      } else {
        discountTotal = input.discountValue;
      }
    }

    const grandTotal = Math.max(0, subTotal - discountTotal);
    const paidAmount = Math.min(input.paidAmount, grandTotal);
    const changeAmount = input.paidAmount > grandTotal ? input.paidAmount - grandTotal : 0;
    const dueAmount = Math.max(0, grandTotal - paidAmount);

    let paymentStatus = "PAID";
    if (dueAmount > 0 && paidAmount > 0) {
      paymentStatus = "PARTIAL";
    } else if (dueAmount > 0 && paidAmount === 0) {
      paymentStatus = "UNPAID";
    }

    // Check customer credit limit if there is due amount
    if (dueAmount > 0) {
      if (!input.customerId) {
        throw new Error("Credit or partial payment requires selecting a registered customer.");
      }
      const customer = await tx.customer.findUnique({ where: { id: input.customerId } });
      if (!customer) throw new Error("Customer not found.");
      if (customer.currentBalance + dueAmount > customer.creditLimit) {
        throw new Error(
          `Customer credit limit exceeded! Limit: Rs. ${customer.creditLimit}, Current Balance: Rs. ${customer.currentBalance}, New Due: Rs. ${dueAmount}`
        );
      }
    }

    const grossProfit = grandTotal - totalCOGS;

    // 4. Create Sale Record
    const sale = await tx.sale.create({
      data: {
        invoiceNumber,
        branchId: input.branchId,
        customerId: input.customerId,
        petId: input.petId,
        cashRegisterId: input.cashRegisterId,
        subTotal,
        discountType: input.discountType || "FIXED",
        discountValue: input.discountValue || 0,
        discountTotal,
        taxTotal: 0,
        grandTotal,
        paidAmount,
        changeAmount,
        dueAmount,
        costOfGoodsSold: totalCOGS,
        grossProfit,
        paymentMethod: input.paymentMethod,
        paymentStatus,
        saleStatus: "COMPLETED",
        cashierId: input.cashierId,
        notes: input.notes,
        items: {
          create: saleItemsToCreate,
        },
      },
      include: {
        items: {
          include: {
            product: true,
            batch: true,
          },
        },
        customer: true,
        pet: true,
        cashier: true,
      },
    });

    // 5. Create Stock Movement records
    for (const mov of stockMovementsToCreate) {
      await tx.stockMovement.create({
        data: {
          ...mov,
          referenceId: sale.id,
        },
      });
    }

    // 6. Customer Ledger & Balance Update (if customer selected)
    if (input.customerId) {
      const customer = await tx.customer.findUnique({ where: { id: input.customerId } });
      const newCustomerBalance = (customer?.currentBalance ?? 0) + dueAmount;

      await tx.customer.update({
        where: { id: input.customerId },
        data: { currentBalance: newCustomerBalance },
      });

      await tx.customerLedger.create({
        data: {
          customerId: input.customerId,
          branchId: input.branchId,
          transactionType: "INVOICE",
          referenceNumber: invoiceNumber,
          referenceId: sale.id,
          debit: grandTotal,
          credit: paidAmount,
          runningBalance: newCustomerBalance,
          notes: `POS invoice ${invoiceNumber} (Total: ${grandTotal}, Paid: ${paidAmount}, Due: ${dueAmount})`,
        },
      });
    }

    // 7. Cash Register Transaction (if Cash/Split and active register open)
    if (paidAmount > 0 && input.cashRegisterId && (input.paymentMethod === "CASH" || input.paymentMethod === "SPLIT")) {
      await tx.cashTransaction.create({
        data: {
          cashRegisterId: input.cashRegisterId,
          transactionType: "CASH_SALE",
          amount: paidAmount,
          referenceId: sale.id,
          notes: `Cash received for invoice ${invoiceNumber}`,
        },
      });
    }

    return sale;
  });
}

export async function getSaleById(id: string) {
  return prisma.sale.findUnique({
    where: { id },
    include: {
      customer: true,
      pet: {
        include: { species: true },
      },
      cashier: true,
      branch: true,
      items: {
        include: {
          product: {
            include: { medicineDetail: true },
          },
          batch: true,
        },
      },
      returns: {
        include: {
          items: true,
        },
      },
    },
  });
}

export async function cancelSale(saleId: string, reason: string, userId: string) {
  return await prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findUnique({
      where: { id: saleId },
      include: { items: true, customer: true },
    });

    if (!sale) throw new Error("Sale invoice not found.");
    if (sale.saleStatus === "CANCELLED") {
      throw new Error("Invoice has already been cancelled.");
    }

    // Revert inventory for each item
    for (const item of sale.items) {
      const activeReturnsQty = item.returnedQuantity;
      const qtyToRevert = item.quantity - activeReturnsQty;

      if (qtyToRevert > 0) {
        // Add back to batch
        const batch = await tx.medicineBatch.findUnique({ where: { id: item.batchId } });
        if (batch) {
          const newBatchQty = batch.currentQuantity + qtyToRevert;
          await tx.medicineBatch.update({
            where: { id: item.batchId },
            data: {
              currentQuantity: newBatchQty,
              status: "ACTIVE",
            },
          });
        }

        // Add back to product stock
        const prodStock = await tx.productStock.findUnique({
          where: {
            productId_branchId: {
              productId: item.productId,
              branchId: sale.branchId,
            },
          },
        });

        const prevStock = prodStock?.currentStock ?? 0;
        const newStock = prevStock + qtyToRevert;

        await tx.productStock.update({
          where: {
            productId_branchId: {
              productId: item.productId,
              branchId: sale.branchId,
            },
          },
          data: { currentStock: newStock },
        });

        // Log stock movement
        await tx.stockMovement.create({
          data: {
            branchId: sale.branchId,
            productId: item.productId,
            batchId: item.batchId,
            movementType: "SALE_RETURN",
            quantity: qtyToRevert,
            previousStock: prevStock,
            newStock,
            referenceType: "VOID_INVOICE",
            referenceId: sale.invoiceNumber,
            userId,
            notes: `Inventory reversal on invoice cancellation: ${reason}`,
          },
        });
      }
    }

    // Revert customer balance and ledger if customer exists
    if (sale.customerId && sale.dueAmount > 0) {
      const customer = await tx.customer.findUnique({ where: { id: sale.customerId } });
      const newBalance = Math.max(0, (customer?.currentBalance ?? 0) - sale.dueAmount);

      await tx.customer.update({
        where: { id: sale.customerId },
        data: { currentBalance: newBalance },
      });

      await tx.customerLedger.create({
        data: {
          customerId: sale.customerId,
          branchId: sale.branchId,
          transactionType: "SALE_RETURN",
          referenceNumber: `VOID-${sale.invoiceNumber}`,
          referenceId: sale.id,
          debit: 0,
          credit: sale.dueAmount,
          runningBalance: newBalance,
          notes: `Reversal of due amount for cancelled invoice ${sale.invoiceNumber}`,
        },
      });
    }

    // Mark sale cancelled
    const updated = await tx.sale.update({
      where: { id: saleId },
      data: {
        saleStatus: "CANCELLED",
        cancellationReason: reason,
        cancelledById: userId,
        cancelledAt: new Date(),
      },
    });

    return updated;
  });
}
