import { prisma } from "@/lib/prisma";

export async function getCustomerLedger(customerId: string) {
  const [customer, ledgers, payments] = await Promise.all([
    prisma.customer.findUnique({
      where: { id: customerId },
      include: { pets: { include: { species: true } } },
    }),
    prisma.customerLedger.findMany({
      where: { customerId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.customerPayment.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      include: { receivedBy: true },
    }),
  ]);

  if (!customer) throw new Error("Customer not found.");

  return {
    customer,
    ledgers,
    payments,
  };
}

export async function recordCustomerPayment({
  customerId,
  branchId,
  amount,
  paymentMethod = "CASH",
  referenceNumber,
  notes,
  receivedById,
}: {
  customerId: string;
  branchId: string;
  amount: number;
  paymentMethod?: string;
  referenceNumber?: string;
  notes?: string;
  receivedById: string;
}) {
  if (amount <= 0) throw new Error("Payment amount must be greater than zero.");

  return await prisma.$transaction(async (tx) => {
    const customer = await tx.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new Error("Customer not found.");

    const count = await tx.customerPayment.count();
    const currentYear = new Date().getFullYear();
    const paymentNumber = `PAY-${currentYear}-${String(count + 1).padStart(6, "0")}`;

    const newBalance = customer.currentBalance - amount;

    // 1. Create Payment Record
    const payment = await tx.customerPayment.create({
      data: {
        paymentNumber,
        customerId,
        branchId,
        amount,
        paymentMethod,
        referenceNumber,
        notes,
        receivedById,
      },
      include: { customer: true, receivedBy: true },
    });

    // 2. Update Customer Balance
    await tx.customer.update({
      where: { id: customerId },
      data: { currentBalance: newBalance },
    });

    // 3. Append to Customer Ledger
    await tx.customerLedger.create({
      data: {
        customerId,
        branchId,
        transactionType: "PAYMENT",
        referenceNumber: paymentNumber,
        referenceId: payment.id,
        debit: 0,
        credit: amount,
        runningBalance: newBalance,
        notes: `Customer dues payment received via ${paymentMethod}. ${notes || ""}`,
      },
    });

    return payment;
  });
}

export async function getSupplierLedger(supplierId: string) {
  const [supplier, ledgers, payments] = await Promise.all([
    prisma.supplier.findUnique({ where: { id: supplierId } }),
    prisma.supplierLedger.findMany({
      where: { supplierId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.supplierPayment.findMany({
      where: { supplierId },
      orderBy: { createdAt: "desc" },
      include: { paidBy: true },
    }),
  ]);

  if (!supplier) throw new Error("Supplier not found.");

  return {
    supplier,
    ledgers,
    payments,
  };
}

export async function recordSupplierPayment({
  supplierId,
  branchId,
  amount,
  paymentMethod = "BANK_TRANSFER",
  referenceNumber,
  notes,
  paidById,
}: {
  supplierId: string;
  branchId: string;
  amount: number;
  paymentMethod?: string;
  referenceNumber?: string;
  notes?: string;
  paidById: string;
}) {
  if (amount <= 0) throw new Error("Payment amount must be greater than zero.");

  return await prisma.$transaction(async (tx) => {
    const supplier = await tx.supplier.findUnique({ where: { id: supplierId } });
    if (!supplier) throw new Error("Supplier not found.");

    const count = await tx.supplierPayment.count();
    const currentYear = new Date().getFullYear();
    const paymentNumber = `SPAY-${currentYear}-${String(count + 1).padStart(6, "0")}`;

    const newBalance = supplier.currentBalance - amount;

    // 1. Create Payment
    const payment = await tx.supplierPayment.create({
      data: {
        paymentNumber,
        supplierId,
        branchId,
        amount,
        paymentMethod,
        referenceNumber,
        notes,
        paidById,
      },
      include: { supplier: true, paidBy: true },
    });

    // 2. Update Supplier Balance
    await tx.supplier.update({
      where: { id: supplierId },
      data: { currentBalance: newBalance },
    });

    // 3. Append to Supplier Ledger
    await tx.supplierLedger.create({
      data: {
        supplierId,
        branchId,
        transactionType: "PAYMENT",
        referenceNumber: paymentNumber,
        referenceId: payment.id,
        debit: amount,
        credit: 0,
        runningBalance: newBalance,
        notes: `Disbursed supplier payment via ${paymentMethod}. ${notes || ""}`,
      },
    });

    return payment;
  });
}
