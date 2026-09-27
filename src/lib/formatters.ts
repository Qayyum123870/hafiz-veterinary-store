import { format, differenceInCalendarDays, isPast } from "date-fns";

export function formatCurrency(amount: number | null | undefined, symbol = "Rs. "): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `${symbol}0.00`;
  }
  return `${symbol}${amount.toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "N/A";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "N/A";
  return format(d, "dd MMM yyyy");
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "N/A";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "N/A";
  return format(d, "dd MMM yyyy, hh:mm a");
}

export function daysUntilExpiry(expiryDate: Date | string): number {
  const d = typeof expiryDate === "string" ? new Date(expiryDate) : expiryDate;
  return differenceInCalendarDays(d, new Date());
}

export function getExpiryBadgeStatus(expiryDate: Date | string): {
  label: string;
  color: "danger" | "warning" | "caution" | "safe";
  daysLeft: number;
} {
  const days = daysUntilExpiry(expiryDate);
  if (days < 0) {
    return { label: `Expired (${Math.abs(days)}d ago)`, color: "danger", daysLeft: days };
  }
  if (days <= 30) {
    return { label: `Expiring in ${days}d`, color: "danger", daysLeft: days };
  }
  if (days <= 60) {
    return { label: `Expiring in ${days}d`, color: "warning", daysLeft: days };
  }
  if (days <= 90) {
    return { label: `Expiring in ${days}d`, color: "caution", daysLeft: days };
  }
  return { label: `Valid (${days}d)`, color: "safe", daysLeft: days };
}
