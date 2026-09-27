import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "./audit.service";

export interface CreateProductInput {
  name: string;
  genericName?: string;
  sku: string;
  barcode?: string;
  categoryId: string;
  subCategoryId?: string;
  brandId?: string;
  productType?: string;
  unit?: string;
  description?: string;
  imageUrl?: string;
  purchasePrice: number;
  salePrice: number;
  wholesalePrice?: number;
  minimumSalePrice?: number;
  minStockThreshold?: number;
  reorderLevel?: number;
  prescriptionRequired?: boolean;
  speciesIds?: string[];
  initialBatch?: {
    batchNumber: string;
    expiryDate: string;
    quantity: number;
  };
  medicineDetails?: {
    strength?: string;
    dosageForm: string;
    composition?: string;
    withdrawalPeriod?: string;
    storageCondition?: string;
    regNumber?: string;
    contraindications?: string;
    sideEffects?: string;
  };
}

export async function getProducts({
  search,
  categoryId,
  productType,
  speciesId,
  page = 1,
  limit = 20,
}: {
  search?: string;
  categoryId?: string;
  productType?: string;
  speciesId?: string;
  page?: number;
  limit?: number;
}) {
  const where: any = {
    deletedAt: null,
  };

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { genericName: { contains: search } },
      { sku: { contains: search } },
      { barcode: { contains: search } },
    ];
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (productType) {
    where.productType = productType;
  }

  if (speciesId) {
    where.productSpecies = {
      some: { speciesId },
    };
  }

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        brand: true,
        medicineDetail: true,
        productSpecies: {
          include: { species: true },
        },
        stocks: true,
        batches: {
          where: { currentQuantity: { gt: 0 } },
          orderBy: { expiryDate: "asc" },
        },
      },
    }),
  ]);

  return {
    products,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getProductById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      subCategory: true,
      brand: true,
      medicineDetail: true,
      productSpecies: {
        include: { species: true },
      },
      stocks: true,
      batches: {
        orderBy: { expiryDate: "asc" },
        include: { supplier: true },
      },
    },
  });
}

export async function findProductByBarcodeOrSku(code: string) {
  return prisma.product.findFirst({
    where: {
      OR: [{ barcode: code }, { sku: code }],
      deletedAt: null,
    },
    include: {
      category: true,
      medicineDetail: true,
      batches: {
        where: {
          currentQuantity: { gt: 0 },
          status: "ACTIVE",
          expiryDate: { gt: new Date() },
        },
        orderBy: { expiryDate: "asc" },
      },
    },
  });
}

export async function createProduct(input: CreateProductInput, userId: string, branchId: string) {
  const existingSku = await prisma.product.findUnique({ where: { sku: input.sku } });
  if (existingSku) {
    throw new Error(`A product with SKU [${input.sku}] already exists.`);
  }

  const product = await prisma.$transaction(async (tx) => {
    const initialQty = input.initialBatch?.quantity ? Number(input.initialBatch.quantity) : 0;

    const created = await tx.product.create({
      data: {
        sku: input.sku,
        barcode: input.barcode,
        name: input.name,
        genericName: input.genericName,
        categoryId: input.categoryId,
        subCategoryId: input.subCategoryId,
        brandId: input.brandId,
        productType: input.productType || "MEDICINE",
        unit: input.unit || "PIECE",
        description: input.description,
        imageUrl: input.imageUrl || null,
        purchasePrice: input.purchasePrice,
        salePrice: input.salePrice,
        wholesalePrice: input.wholesalePrice || 0,
        minimumSalePrice: input.minimumSalePrice || 0,
        minStockThreshold: input.minStockThreshold || 10,
        reorderLevel: input.reorderLevel || 20,
        prescriptionRequired: !!input.prescriptionRequired,
        isBatchTracked: true,
        stocks: {
          create: {
            branchId,
            currentStock: initialQty,
          },
        },
      },
    });

    if (
      input.initialBatch &&
      input.initialBatch.batchNumber &&
      input.initialBatch.expiryDate &&
      initialQty > 0
    ) {
      const batch = await tx.medicineBatch.create({
        data: {
          productId: created.id,
          batchNumber: input.initialBatch.batchNumber,
          expiryDate: new Date(input.initialBatch.expiryDate),
          costPrice: input.purchasePrice,
          salePrice: input.salePrice,
          initialQuantity: initialQty,
          currentQuantity: initialQty,
          status: "ACTIVE",
        },
      });

      await tx.stockMovement.create({
        data: {
          branchId,
          productId: created.id,
          batchId: batch.id,
          movementType: "ADJUSTMENT_ADD",
          quantity: initialQty,
          previousStock: 0,
          newStock: initialQty,
          referenceType: "OPENING_STOCK",
          referenceId: batch.batchNumber,
          userId,
          notes: `Initial opening batch stock: ${batch.batchNumber}`,
        },
      });
    }

    if (input.speciesIds && input.speciesIds.length > 0) {
      await tx.productSpecies.createMany({
        data: input.speciesIds.map((speciesId) => ({
          productId: created.id,
          speciesId,
        })),
      });
    }

    if (input.medicineDetails) {
      await tx.medicineDetail.create({
        data: {
          productId: created.id,
          ...input.medicineDetails,
        },
      });
    }

    return created;
  });

  await logAuditEvent({
    userId,
    branchId,
    action: "PRODUCT_CREATED",
    entity: "Product",
    entityId: product.id,
    newValues: { name: product.name, sku: product.sku, price: product.salePrice },
  });

  return product;
}

export async function softDeleteProduct(productId: string, userId: string, branchId: string) {
  // Check if product is referenced in sales or purchases
  const [salesCount, purchaseCount] = await Promise.all([
    prisma.saleItem.count({ where: { productId } }),
    prisma.purchaseItem.count({ where: { productId } }),
  ]);

  const product = await prisma.product.update({
    where: { id: productId },
    data: {
      deletedAt: new Date(),
      isActive: false,
    },
  });

  await logAuditEvent({
    userId,
    branchId,
    action: "PRODUCT_SOFT_DELETED",
    entity: "Product",
    entityId: productId,
    oldValues: { name: product.name, referencedInSales: salesCount, referencedInPurchases: purchaseCount },
  });

  return product;
}
