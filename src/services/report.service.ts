import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subDays } from "date-fns";

export async function getDashboardMetrics(branchId?: string) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const saleWhere: any = {
    saleStatus: "COMPLETED",
    createdAt: { gte: todayStart, lte: todayEnd },
  };
  if (branchId) saleWhere.branchId = branchId;

  // 1. Today's Sales
  const todaySales = await prisma.sale.findMany({
    where: saleWhere,
    select: { grandTotal: true, costOfGoodsSold: true, grossProfit: true },
  });

  const todaySalesTotal = todaySales.reduce((acc, s) => acc + s.grandTotal, 0);
  const todayProfitTotal = todaySales.reduce((acc, s) => acc + s.grossProfit, 0);

  // 2. Today's Purchases
  const purchaseWhere: any = {
    purchaseDate: { gte: todayStart, lte: todayEnd },
    status: "RECEIVED",
  };
  if (branchId) purchaseWhere.branchId = branchId;

  const todayPurchases = await prisma.purchase.findMany({
    where: purchaseWhere,
    select: { grandTotal: true },
  });
  const todayPurchasesTotal = todayPurchases.reduce((acc, p) => acc + p.grandTotal, 0);

  // 3. Today's Expenses
  const expenseWhere: any = {
    paidDate: { gte: todayStart, lte: todayEnd },
  };
  if (branchId) expenseWhere.branchId = branchId;

  const todayExpenses = await prisma.expense.findMany({
    where: expenseWhere,
    select: { amount: true },
  });
  const todayExpensesTotal = todayExpenses.reduce((acc, e) => acc + e.amount, 0);

  // 4. Receivables & Payables
  const [customerAggregate, supplierAggregate] = await Promise.all([
    prisma.customer.aggregate({
      where: { deletedAt: null },
      _sum: { currentBalance: true },
    }),
    prisma.supplier.aggregate({
      where: { deletedAt: null },
      _sum: { currentBalance: true },
    }),
  ]);

  const customerReceivables = customerAggregate._sum.currentBalance ?? 0;
  const supplierPayables = supplierAggregate._sum.currentBalance ?? 0;

  // 5. Total Inventory Valuation (sum of active batch quantities * costPrice)
  const activeBatches = await prisma.medicineBatch.findMany({
    where: { currentQuantity: { gt: 0 } },
    select: { currentQuantity: true, costPrice: true, expiryDate: true },
  });

  const totalInventoryValue = activeBatches.reduce(
    (acc, b) => acc + b.currentQuantity * b.costPrice,
    0
  );

  // 6. Expiry counts
  const expiredCount = activeBatches.filter((b) => new Date(b.expiryDate) <= now).length;
  const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const nearExpiryCount = activeBatches.filter(
    (b) => new Date(b.expiryDate) > now && new Date(b.expiryDate) <= in60Days
  ).length;

  // 7. Low Stock Products
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    include: { stocks: true },
  });

  const lowStockCount = products.filter((p) => {
    const totalStock = p.stocks.reduce((acc, s) => acc + s.currentStock, 0);
    return totalStock <= p.minStockThreshold;
  }).length;

  // 8. Recent 5 Sales & Purchases
  const [recentSales, recentPurchases] = await Promise.all([
    prisma.sale.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { customer: true, cashier: true },
    }),
    prisma.purchase.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { supplier: true },
    }),
  ]);

  // 9. Past 7 days sales trend
  const past7Days = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(now, 6 - i);
    return {
      dateStr: date.toISOString().split("T")[0],
      dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
      sales: 0,
      profit: 0,
    };
  });

  const sevenDaysSales = await prisma.sale.findMany({
    where: {
      saleStatus: "COMPLETED",
      createdAt: { gte: subDays(todayStart, 6) },
    },
    select: { grandTotal: true, grossProfit: true, createdAt: true },
  });

  sevenDaysSales.forEach((s) => {
    const dateKey = s.createdAt.toISOString().split("T")[0];
    const match = past7Days.find((d) => d.dateStr === dateKey);
    if (match) {
      match.sales += s.grandTotal;
      match.profit += s.grossProfit;
    }
  });

  return {
    kpis: {
      todaySales: todaySalesTotal,
      todayPurchases: todayPurchasesTotal,
      todayProfit: todayProfitTotal,
      todayExpenses: todayExpensesTotal,
      customerReceivables,
      supplierPayables,
      totalInventoryValue,
      lowStockCount,
      expiredCount,
      nearExpiryCount,
    },
    charts: {
      salesTrend: past7Days,
    },
    recentSales,
    recentPurchases,
  };
}

export async function getProfitAndLossReport({
  startDate,
  endDate,
  branchId,
}: {
  startDate: Date | string;
  endDate: Date | string;
  branchId?: string;
}) {
  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;

  const saleWhere: any = {
    saleStatus: "COMPLETED",
    createdAt: { gte: start, lte: end },
  };
  if (branchId) saleWhere.branchId = branchId;

  const sales = await prisma.sale.findMany({
    where: saleWhere,
    select: {
      grandTotal: true,
      costOfGoodsSold: true,
      grossProfit: true,
      discountTotal: true,
    },
  });

  const grossSales = sales.reduce((acc, s) => acc + s.grandTotal + s.discountTotal, 0);
  const discountsGiven = sales.reduce((acc, s) => acc + s.discountTotal, 0);
  const netSales = sales.reduce((acc, s) => acc + s.grandTotal, 0);
  const cogs = sales.reduce((acc, s) => acc + s.costOfGoodsSold, 0);
  const grossProfit = netSales - cogs;

  const expenseWhere: any = {
    paidDate: { gte: start, lte: end },
  };
  if (branchId) expenseWhere.branchId = branchId;

  const expenses = await prisma.expense.findMany({
    where: expenseWhere,
    include: { category: true },
  });

  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = grossProfit - totalExpenses;

  // Group expenses by category
  const expensesByCategory: Record<string, number> = {};
  expenses.forEach((e) => {
    const catName = e.category.name;
    expensesByCategory[catName] = (expensesByCategory[catName] || 0) + e.amount;
  });

  return {
    period: { start, end },
    grossSales,
    discountsGiven,
    netSales,
    cogs,
    grossProfit,
    grossMarginPercent: netSales > 0 ? (grossProfit / netSales) * 100 : 0,
    totalExpenses,
    netProfit,
    netMarginPercent: netSales > 0 ? (netProfit / netSales) * 100 : 0,
    expensesByCategory,
  };
}
