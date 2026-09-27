import { prisma } from "@/lib/prisma";

export async function getActiveCashRegister(branchId: string, userId: string) {
  return prisma.cashRegister.findFirst({
    where: {
      branchId,
      userId,
      status: "OPEN",
    },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" },
      },
      sales: {
        where: { saleStatus: "COMPLETED" },
      },
    },
  });
}

export async function openCashRegister({
  branchId,
  userId,
  openingCash,
}: {
  branchId: string;
  userId: string;
  openingCash: number;
}) {
  const existing = await prisma.cashRegister.findFirst({
    where: { branchId, userId, status: "OPEN" },
  });

  if (existing) {
    throw new Error("You already have an active open cash register session.");
  }

  return prisma.cashRegister.create({
    data: {
      branchId,
      userId,
      openingCash,
      status: "OPEN",
    },
  });
}

export async function closeCashRegister({
  registerId,
  actualClosingCash,
  closingNotes,
}: {
  registerId: string;
  actualClosingCash: number;
  closingNotes?: string;
}) {
  const register = await prisma.cashRegister.findUnique({
    where: { id: registerId },
    include: {
      transactions: true,
      sales: {
        where: { saleStatus: "COMPLETED", paymentMethod: { in: ["CASH", "SPLIT"] } },
      },
    },
  });

  if (!register) throw new Error("Cash register not found.");
  if (register.status === "CLOSED") throw new Error("Cash register is already closed.");

  // Expected cash = Opening Cash + Cash Transactions Net
  const cashSalesTotal = register.transactions
    .filter((t) => t.transactionType === "CASH_SALE" || t.transactionType === "CUSTOMER_PAYMENT" || t.transactionType === "CASH_IN")
    .reduce((sum, t) => sum + t.amount, 0);

  const cashOutTotal = register.transactions
    .filter((t) => t.transactionType === "EXPENSE_PAYMENT" || t.transactionType === "CASH_REFUND" || t.transactionType === "CASH_OUT")
    .reduce((sum, t) => sum + t.amount, 0);

  const expectedClosingCash = register.openingCash + cashSalesTotal - cashOutTotal;
  const discrepancy = actualClosingCash - expectedClosingCash;

  return prisma.cashRegister.update({
    where: { id: registerId },
    data: {
      status: "CLOSED",
      closedAt: new Date(),
      expectedClosingCash,
      actualClosingCash,
      discrepancy,
      closingNotes,
    },
  });
}
