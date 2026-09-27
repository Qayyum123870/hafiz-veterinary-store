export interface BatchStockSource {
  id: string;
  batchNumber: string;
  expiryDate: Date | string;
  currentQuantity: number;
  costPrice: number;
  salePrice: number;
  status: string;
}

export interface AllocatedBatchItem {
  batchId: string;
  batchNumber: string;
  quantityToDeduct: number;
  unitCost: number;
  unitPrice: number;
  expiryDate: Date | string;
}

/**
 * First-Expiry-First-Out (FEFO) Allocation Engine
 * Automatically selects the closest non-expired batches to fulfill requested quantity.
 * Throws an error if sufficient non-expired stock does not exist.
 */
export function allocateStockFEFO(
  batches: BatchStockSource[],
  requestedQty: number
): {
  allocations: AllocatedBatchItem[];
  totalAllocated: number;
  totalCostOfGoodsSold: number;
} {
  if (requestedQty <= 0) {
    throw new Error("Requested quantity must be greater than zero.");
  }

  const now = new Date();

  // Filter only active, non-expired batches with positive quantity, sorted by expiry ascending
  const availableBatches = batches
    .filter((b) => {
      const exp = typeof b.expiryDate === "string" ? new Date(b.expiryDate) : b.expiryDate;
      return b.status === "ACTIVE" && b.currentQuantity > 0 && exp > now;
    })
    .sort((a, b) => {
      const expA = typeof a.expiryDate === "string" ? new Date(a.expiryDate).getTime() : a.expiryDate.getTime();
      const expB = typeof b.expiryDate === "string" ? new Date(b.expiryDate).getTime() : b.expiryDate.getTime();
      return expA - expB;
    });

  const totalAvailable = availableBatches.reduce((acc, b) => acc + b.currentQuantity, 0);
  if (totalAvailable < requestedQty) {
    throw new Error(
      `Insufficient active, non-expired stock available. Requested: ${requestedQty}, Available: ${totalAvailable}`
    );
  }

  let remaining = requestedQty;
  const allocations: AllocatedBatchItem[] = [];
  let totalCostOfGoodsSold = 0;

  for (const batch of availableBatches) {
    if (remaining <= 0) break;

    const takeQty = Math.min(batch.currentQuantity, remaining);
    allocations.push({
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      quantityToDeduct: takeQty,
      unitCost: batch.costPrice,
      unitPrice: batch.salePrice,
      expiryDate: batch.expiryDate,
    });

    totalCostOfGoodsSold += takeQty * batch.costPrice;
    remaining -= takeQty;
  }

  return {
    allocations,
    totalAllocated: requestedQty,
    totalCostOfGoodsSold: Number(totalCostOfGoodsSold.toFixed(2)),
  };
}

/**
 * Calculates invoice grand total, line totals, and net margin
 */
export function calculateLineTotal(
  quantity: number,
  unitPrice: number,
  discount = 0,
  taxPercent = 0
): {
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
} {
  const baseSubtotal = quantity * unitPrice;
  const discountedSubtotal = Math.max(0, baseSubtotal - discount);
  const taxAmount = (discountedSubtotal * taxPercent) / 100;
  const grandTotal = discountedSubtotal + taxAmount;

  return {
    subtotal: Number(baseSubtotal.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    grandTotal: Number(grandTotal.toFixed(2)),
  };
}
