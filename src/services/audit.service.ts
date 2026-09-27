import { prisma } from "@/lib/prisma";

export async function logAuditEvent({
  userId,
  branchId,
  action,
  entity,
  entityId,
  oldValues,
  newValues,
  ipAddress = "127.0.0.1",
}: {
  userId?: string | null;
  branchId?: string | null;
  action: string;
  entity: string;
  entityId: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
}) {
  try {
    return await prisma.auditLog.create({
      data: {
        userId,
        branchId,
        action,
        entity,
        entityId,
        oldValues: oldValues ? JSON.stringify(oldValues) : null,
        newValues: newValues ? JSON.stringify(newValues) : null,
        ipAddress,
      },
    });
  } catch (err) {
    console.error("Failed to record audit log:", err);
  }
}
