import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Hafiz Veterinary Store database seeding...");

  // 1. Create Main Branch
  const mainBranch = await prisma.branch.upsert({
    where: { code: "MAIN-01" },
    update: {},
    create: {
      code: "MAIN-01",
      name: "Hafiz Veterinary Store - Main Branch",
      phone: "+92 300 8765432",
      email: "hafizvetstore@gmail.com",
      address: "Shop # 12-14, Ghalla Mandi Veterinary Complex",
      city: "Sahiwal",
      isMain: true,
      isActive: true,
    },
  });
  console.log("✅ Main Branch initialized:", mainBranch.name);

  // 2. Initialize Business Settings
  await prisma.businessSetting.upsert({
    where: { id: "default-settings" },
    update: {},
    create: {
      id: "default-settings",
      branchId: mainBranch.id,
      shopName: "Hafiz Veterinary Store & Pet Clinic",
      tagline: "Quality Veterinary Medicines, Pet Care & Livestock Solutions",
      address: "Shop # 12-14, Ghalla Mandi Veterinary Complex, Sahiwal, Pakistan",
      phone: "+92 300 8765432",
      whatsapp: "+92 300 8765432",
      email: "info@hafizvetstore.com",
      taxNumber: "NTN-7849302-1",
      currencySymbol: "Rs. ",
      invoicePrefix: "INV",
      invoiceFooterNotes: "Goods once sold can only be returned within 7 days in original packaging with batch verification. Expired cold-chain vaccines are strictly non-returnable.",
      stockAllocationStrategy: "FEFO",
      lowStockAlertDays: 60,
      maxDiscountCashierPercent: 5.0,
      allowCreditSales: true,
      allowNegativeStock: false,
    },
  });
  console.log("✅ Business Settings configured");

  // 3. Granular Permissions
  const permissionsList = [
    { code: "dashboard.view", module: "dashboard", description: "View dashboard overview" },
    { code: "dashboard.view_financials", module: "dashboard", description: "View sensitive financials (Profit, COGS, Ledgers)" },
    { code: "products.view", module: "products", description: "View products and catalog" },
    { code: "products.create_update", module: "products", description: "Create and edit products" },
    { code: "products.delete", module: "products", description: "Soft delete products" },
    { code: "medicines.batch_manage", module: "medicines", description: "Manage medicine batches and expiry" },
    { code: "inventory.view", module: "inventory", description: "View stock levels and movements" },
    { code: "inventory.adjust", module: "inventory", description: "Perform physical stock count adjustments" },
    { code: "sales.pos_create", module: "sales", description: "Access POS checkout and bill customers" },
    { code: "sales.apply_custom_discount", module: "sales", description: "Override max cashier discount limit" },
    { code: "sales.cancel_void", module: "sales", description: "Cancel or void issued invoices" },
    { code: "sales.return", module: "sales", description: "Process customer sales returns" },
    { code: "purchases.create_receive", module: "purchases", description: "Create purchase bills and receive stock" },
    { code: "purchases.return", module: "purchases", description: "Return defective/expired stock to supplier" },
    { code: "customers.manage", module: "customers", description: "Create, view, and update customer profiles" },
    { code: "suppliers.manage", module: "suppliers", description: "Create, view, and update supplier profiles" },
    { code: "ledgers.view", module: "financials", description: "View customer and supplier double-entry ledgers" },
    { code: "payments.record", module: "financials", description: "Record incoming and outgoing debt payments" },
    { code: "expenses.manage", module: "expenses", description: "Record and categorize shop expenses" },
    { code: "cash_register.close_open", module: "register", description: "Open/close cash register shifts and reconcile float" },
    { code: "reports.view_profit_loss", module: "reports", description: "Generate Profit/Loss and Financial BI reports" },
    { code: "reports.view_inventory", module: "reports", description: "Generate valuation and stock audit reports" },
    { code: "audit.view", module: "audit", description: "View immutable audit logs" },
    { code: "settings.update", module: "settings", description: "Modify system and store settings" },
  ];

  for (const perm of permissionsList) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: {},
      create: perm,
    });
  }
  console.log(`✅ ${permissionsList.length} Granular Permissions registered`);

  // 4. Roles
  const roles = [
    { name: "SUPER_ADMIN", description: "Full system master access across all branches", isSystem: true },
    { name: "ADMIN_OWNER", description: "Store Owner with complete operational and financial control", isSystem: true },
    { name: "MANAGER", description: "Store Supervisor with purchasing and void authorization", isSystem: true },
    { name: "PHARMACIST", description: "Dispenses drugs, verifies batches and animal withdrawal periods", isSystem: true },
    { name: "CASHIER", description: "High-speed POS operator with shift cash drawer controls", isSystem: true },
    { name: "INVENTORY_MANAGER", description: "Warehouse and stock receiving supervisor", isSystem: true },
    { name: "ACCOUNTANT", description: "Financial ledgers, payments, and P&L auditing", isSystem: true },
    { name: "VIEWER", description: "Read-only inspection and reporting access", isSystem: true },
  ];

  const dbRoles: Record<string, any> = {};
  for (const r of roles) {
    dbRoles[r.name] = await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: r,
    });
  }
  console.log("✅ Roles initialized");

  // Assign all permissions to SUPER_ADMIN & ADMIN_OWNER
  const allDbPermissions = await prisma.permission.findMany();
  for (const perm of allDbPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: dbRoles.SUPER_ADMIN.id, permissionId: perm.id } },
      update: {},
      create: { roleId: dbRoles.SUPER_ADMIN.id, permissionId: perm.id },
    });
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: dbRoles.ADMIN_OWNER.id, permissionId: perm.id } },
      update: {},
      create: { roleId: dbRoles.ADMIN_OWNER.id, permissionId: perm.id },
    });
  }

  // Assign Pharmacist permissions
  const pharmacistPermCodes = [
    "dashboard.view", "products.view", "products.create_update", "medicines.batch_manage",
    "inventory.view", "sales.pos_create", "sales.return", "customers.manage", "reports.view_inventory",
  ];
  for (const perm of allDbPermissions.filter(p => pharmacistPermCodes.includes(p.code))) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: dbRoles.PHARMACIST.id, permissionId: perm.id } },
      update: {},
      create: { roleId: dbRoles.PHARMACIST.id, permissionId: perm.id },
    });
  }

  // Assign Cashier permissions
  const cashierPermCodes = [
    "dashboard.view", "products.view", "sales.pos_create", "sales.return",
    "customers.manage", "payments.record", "cash_register.close_open",
  ];
  for (const perm of allDbPermissions.filter(p => cashierPermCodes.includes(p.code))) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: dbRoles.CASHIER.id, permissionId: perm.id } },
      update: {},
      create: { roleId: dbRoles.CASHIER.id, permissionId: perm.id },
    });
  }
  console.log("✅ Role permissions linked");

  // 5. Default Users with secure hashed passwords
  const passwordHash = await bcrypt.hash("admin123", 10);
  const staffPasswordHash = await bcrypt.hash("staff123", 10);

  const adminUser = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      email: "admin@hafizvetstore.com",
      passwordHash,
      fullName: "Hafiz Muhammad Bilal (Owner)",
      phone: "+92 300 8765432",
      branchId: mainBranch.id,
      status: "ACTIVE",
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: dbRoles.SUPER_ADMIN.id } },
    update: {},
    create: { userId: adminUser.id, roleId: dbRoles.SUPER_ADMIN.id },
  });

  const pharmacistUser = await prisma.user.upsert({
    where: { username: "pharmacist" },
    update: {},
    create: {
      username: "pharmacist",
      email: "pharmacist@hafizvetstore.com",
      passwordHash: staffPasswordHash,
      fullName: "Dr. Hamza Tariq (DVM, Lead Pharmacist)",
      phone: "+92 301 9876543",
      branchId: mainBranch.id,
      status: "ACTIVE",
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: pharmacistUser.id, roleId: dbRoles.PHARMACIST.id } },
    update: {},
    create: { userId: pharmacistUser.id, roleId: dbRoles.PHARMACIST.id },
  });

  const cashierUser = await prisma.user.upsert({
    where: { username: "cashier" },
    update: {},
    create: {
      username: "cashier",
      email: "cashier@hafizvetstore.com",
      passwordHash: staffPasswordHash,
      fullName: "Muhammad Usman (Cashier / POS)",
      phone: "+92 302 5554433",
      branchId: mainBranch.id,
      status: "ACTIVE",
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: cashierUser.id, roleId: dbRoles.CASHIER.id } },
    update: {},
    create: { userId: cashierUser.id, roleId: dbRoles.CASHIER.id },
  });
  console.log("✅ Seed Users initialized: admin, pharmacist, cashier");

  // 6. Species Master Data
  const speciesList = [
    { name: "Dog", description: "Canine companions and guard dogs" },
    { name: "Cat", description: "Felines (Domestic, Persian, Siamese)" },
    { name: "Cow", description: "Dairy and beef cattle" },
    { name: "Buffalo", description: "Nili-Ravi and Kundi dairy buffaloes" },
    { name: "Goat", description: "Caprine livestock (Beetal, Kamori, Teddy)" },
    { name: "Sheep", description: "Ovine livestock" },
    { name: "Horse", description: "Equine horses and mules" },
    { name: "Poultry", description: "Broiler, layer, and desi poultry birds" },
    { name: "Bird", description: "Pet birds, parrots, pigeons" },
    { name: "Rabbit", description: "Domestic and pet rabbits" },
  ];

  const dbSpecies: Record<string, any> = {};
  for (const s of speciesList) {
    dbSpecies[s.name] = await prisma.species.upsert({
      where: { name: s.name },
      update: {},
      create: s,
    });
  }
  console.log("✅ Species catalog seeded");

  // 7. Categories & Subcategories
  const categoriesData = [
    {
      name: "Antibiotics & Antimicrobials",
      slug: "antibiotics",
      description: "Broad-spectrum injectables, oral suspensions and water-soluble powders",
      subs: ["Injectable Antibiotics", "Oral Suspensions", "Intramammary Infusions"],
    },
    {
      name: "Vaccines & Biologics",
      slug: "vaccines",
      description: "Cold-chain 2-8°C biologicals for rabies, FMD, HS, enterotoxemia, ND",
      subs: ["Livestock Vaccines", "Pet Vaccines (DHPPi, Rabies)", "Poultry Vaccines"],
    },
    {
      name: "Anthelmintics & Dewormers",
      slug: "dewormers",
      description: "Broad-spectrum internal and external parasite treatments",
      subs: ["Oral Dewormer Drench", "Pour-on / Spot-on", "Injectable Antiparasitic"],
    },
    {
      name: "Nutritional & Mineral Supplements",
      slug: "supplements",
      description: "Calcium gels, liver tonics, vitamins AD3E, rumen stimulants",
      subs: ["Calcium & Phosphorus Drenches", "Injectable Vitamins", "Metabolic Stimulants"],
    },
    {
      name: "Anti-inflammatory & Analgesics",
      slug: "anti-inflammatory",
      description: "NSAIDs, antipyretics, steroids for pain and fever relief",
      subs: ["Injectable NSAIDs", "Oral Pain Relief Tablets"],
    },
    {
      name: "Pet Food & Clinical Diets",
      slug: "pet-food",
      description: "High-protein dry and wet food for dogs, cats, and birds",
      subs: ["Dry Dog Kibble", "Dry Cat Kibble", "Wet Pouch & Gravy Cans", "Bird Seed Mixes"],
    },
    {
      name: "Surgical & Farm Equipment",
      slug: "equipment",
      description: "Syringes, needles, drenching guns, bandages, antiseptic sprays",
      subs: ["Disposable Syringes & Needles", "Wound Care & Antiseptics", "Castrators & Tools"],
    },
  ];

  const dbCategories: Record<string, any> = {};
  const dbSubCategories: Record<string, any> = {};

  for (const cat of categoriesData) {
    const createdCat = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: { name: cat.name, slug: cat.slug, description: cat.description },
    });
    dbCategories[cat.slug] = createdCat;

    for (const subName of cat.subs) {
      const subSlug = subName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const createdSub = await prisma.subCategory.upsert({
        where: { categoryId_name: { categoryId: createdCat.id, name: subName } },
        update: {},
        create: {
          categoryId: createdCat.id,
          name: subName,
          slug: subSlug,
        },
      });
      dbSubCategories[subName] = createdSub;
    }
  }
  console.log("✅ Categories and Subcategories seeded");

  // 8. Pharmaceutical Brands
  const brandsList = [
    { name: "Zoetis Animal Health", country: "USA" },
    { name: "Boehringer Ingelheim", country: "Germany" },
    { name: "MSD Animal Health", country: "Netherlands" },
    { name: "ICI Pakistan Life Sciences", country: "Pakistan" },
    { name: "Hilton Pharma Animal Health", country: "Pakistan" },
    { name: "Royal Canin", country: "France" },
    { name: "Whiskas / Mars Petcare", country: "UK" },
    { name: "Star Laboratories", country: "Pakistan" },
  ];

  const dbBrands: Record<string, any> = {};
  for (const b of brandsList) {
    dbBrands[b.name] = await prisma.brand.upsert({
      where: { name: b.name },
      update: {},
      create: b,
    });
  }
  console.log("✅ Brands seeded");

  // 9. Suppliers
  const suppliersData = [
    {
      supplierNumber: "SUP-000001",
      name: "Punjab Vet Pharma Distribution",
      companyName: "Punjab Vet Pharma Ltd",
      contactPerson: "Chaudhry Nadeem",
      phone: "+92 300 8451122",
      whatsapp: "+92 300 8451122",
      email: "nadeem@punjabvetpharma.com",
      address: "Warehouse 44, Veterinary Wholesale Market",
      city: "Lahore",
      paymentTermsDays: 30,
      openingBalance: 0,
      currentBalance: 0,
    },
    {
      supplierNumber: "SUP-000002",
      name: "Al-Razi Veterinary Supplies",
      companyName: "Al-Razi Biologicals & Pharma",
      contactPerson: "Dr. Qasim Raza",
      phone: "+92 321 4567890",
      whatsapp: "+92 321 4567890",
      email: "orders@alrazivet.pk",
      address: "Plaza 8, Industrial Estate Phase 2",
      city: "Multan",
      paymentTermsDays: 15,
      openingBalance: 0,
      currentBalance: 0,
    },
    {
      supplierNumber: "SUP-000003",
      name: "Pet Nutrition World Importers",
      companyName: "Pet World Pakistan Pvt Ltd",
      contactPerson: "Hassan Sheikh",
      phone: "+92 333 9876543",
      whatsapp: "+92 333 9876543",
      email: "imports@petworld.pk",
      address: "Suite 302, Business Bay, Clifton",
      city: "Karachi",
      paymentTermsDays: 45,
      openingBalance: 0,
      currentBalance: 0,
    },
  ];

  const dbSuppliers: Record<string, any> = {};
  for (const s of suppliersData) {
    dbSuppliers[s.supplierNumber] = await prisma.supplier.upsert({
      where: { supplierNumber: s.supplierNumber },
      update: {},
      create: s,
    });
  }
  console.log("✅ Suppliers seeded");

  // 10. Customers & Pets
  const customer1 = await prisma.customer.upsert({
    where: { customerNumber: "CUS-000001" },
    update: {},
    create: {
      customerNumber: "CUS-000001",
      name: "Mian Muhammad Ali",
      phone: "03001122334",
      whatsapp: "03001122334",
      email: "ali.petlover@gmail.com",
      address: "House 45-B, Civil Lines",
      city: "Sahiwal",
      openingBalance: 0,
      currentBalance: 0,
      creditLimit: 30000,
    },
  });

  // Tommy (Dog)
  await prisma.pet.create({
    data: {
      customerId: customer1.id,
      name: "Tommy",
      speciesId: dbSpecies.Dog.id,
      breed: "German Shepherd",
      gender: "MALE",
      dateOfBirth: new Date("2023-04-10"),
      weightKg: 32.5,
      color: "Black & Tan",
      microchipNumber: "985141002341992",
      allergies: "Beef protein sensitivity",
      medicalNotes: "Fully vaccinated with DHPPi & Rabisin. Sensitive skin in summer.",
    },
  });

  // Mishi (Cat)
  await prisma.pet.create({
    data: {
      customerId: customer1.id,
      name: "Mishi",
      speciesId: dbSpecies.Cat.id,
      breed: "Persian Longhair",
      gender: "FEMALE",
      dateOfBirth: new Date("2024-01-15"),
      weightKg: 3.8,
      color: "Pure White",
      allergies: "None",
      medicalNotes: "Regular deworming on schedule.",
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { customerNumber: "CUS-000002" },
    update: {},
    create: {
      customerNumber: "CUS-000002",
      name: "Chaudhry Aslam Dairy Farm",
      phone: "03015566778",
      whatsapp: "03015566778",
      email: "aslamdairy@gmail.com",
      address: "Chak 88/9-L, Farooq Farm",
      city: "Sahiwal",
      openingBalance: 0,
      currentBalance: 0,
      creditLimit: 200000,
      notes: "Commercial dairy herd with 65 milking Nili-Ravi buffaloes and Holstein Friesian cows",
    },
  });
  console.log("✅ Customers & Pet Patient Profiles seeded");

  // 11. Real-World Veterinary Medicines & Products
  // Real dates for FEFO demonstration: Active, Near-Expiry (45 days), Expired (30 days ago)
  const now = new Date();
  const futureExpiry1 = new Date(now.getFullYear() + 2, now.getMonth() + 4, 15);
  const futureExpiry2 = new Date(now.getFullYear() + 1, now.getMonth() + 8, 20);
  const nearExpiryDate = new Date(now.getTime() + 40 * 24 * 60 * 60 * 1000); // 40 days ahead
  const expiredDate = new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000);   // 25 days ago

  const productsCatalog = [
    {
      sku: "VET-AMX-100",
      barcode: "896400010101",
      name: "Amoxicillin LA 15% Injection 100ml",
      genericName: "Amoxicillin Trihydrate (Long Acting)",
      categorySlug: "antibiotics",
      subCategoryName: "Injectable Antibiotics",
      brandName: "ICI Pakistan Life Sciences",
      productType: "MEDICINE",
      unit: "VIAL",
      purchasePrice: 950.0,
      salePrice: 1250.0,
      minStockThreshold: 10,
      reorderLevel: 25,
      prescriptionRequired: true,
      speciesList: ["Cow", "Buffalo", "Sheep", "Goat"],
      medicineDetails: {
        strength: "150 mg/ml",
        dosageForm: "INJECTION",
        composition: "Amoxicillin Trihydrate BP 150mg per ml oily vehicle",
        withdrawalPeriod: "Meat: 21 days | Milk: 72 hours (3 days)",
        storageCondition: "Store below 25°C. Protect from direct sunlight.",
        regNumber: "078491-DVM",
        contraindications: "Do not administer intravenously or into joint cavities.",
        sideEffects: "Occasional local tissue reaction at injection site.",
      },
      batches: [
        {
          batchNumber: "AMX-2026-A",
          expiryDate: futureExpiry1,
          costPrice: 950.0,
          salePrice: 1250.0,
          quantity: 45,
          status: "ACTIVE",
          supplierKey: "SUP-000001",
        },
        {
          batchNumber: "AMX-2025-OLD",
          expiryDate: nearExpiryDate, // FEFO prioritizes this batch first!
          costPrice: 900.0,
          salePrice: 1200.0,
          quantity: 12,
          status: "ACTIVE",
          supplierKey: "SUP-000001",
        },
      ],
    },
    {
      sku: "VET-IVM-50",
      barcode: "896400010202",
      name: "Ivermectin 1% Injection 50ml",
      genericName: "Ivermectin (Antiparasitic)",
      categorySlug: "dewormers",
      subCategoryName: "Injectable Antiparasitic",
      brandName: "Star Laboratories",
      productType: "MEDICINE",
      unit: "VIAL",
      purchasePrice: 420.0,
      salePrice: 600.0,
      minStockThreshold: 15,
      reorderLevel: 30,
      prescriptionRequired: true,
      speciesList: ["Cow", "Buffalo", "Sheep", "Goat", "Horse"],
      medicineDetails: {
        strength: "10 mg/ml",
        dosageForm: "INJECTION",
        composition: "Ivermectin USP 1% w/v",
        withdrawalPeriod: "Meat: 35 days | Do not use in female dairy cattle producing milk for human consumption.",
        storageCondition: "Store in cool dry place below 30°C.",
        regNumber: "049301-DVM",
      },
      batches: [
        {
          batchNumber: "IVM-8812",
          expiryDate: futureExpiry2,
          costPrice: 420.0,
          salePrice: 600.0,
          quantity: 35,
          status: "ACTIVE",
          supplierKey: "SUP-000002",
        },
      ],
    },
    {
      sku: "VET-RAB-10",
      barcode: "896400010303",
      name: "Rabisin Inactivated Rabies Vaccine 10 Doses",
      genericName: "Inactivated Rabies Virus (GS 57 Wistar strain)",
      categorySlug: "vaccines",
      subCategoryName: "Pet Vaccines (DHPPi, Rabies)",
      brandName: "Boehringer Ingelheim",
      productType: "VACCINE",
      unit: "VIAL",
      purchasePrice: 2200.0,
      salePrice: 2850.0,
      minStockThreshold: 5,
      reorderLevel: 12,
      prescriptionRequired: true,
      speciesList: ["Dog", "Cat", "Horse"],
      medicineDetails: {
        strength: ">= 1 IU per dose",
        dosageForm: "VACCINE",
        composition: "Inactivated Rabies Virus >= 1 IU with aluminium hydroxide adjuvant",
        withdrawalPeriod: "Zero days",
        storageCondition: "Refrigerate 2°C - 8°C. DO NOT FREEZE. Strict cold chain mandatory.",
        regNumber: "021994-BIO",
      },
      batches: [
        {
          batchNumber: "RAB-7741",
          expiryDate: futureExpiry1,
          costPrice: 2200.0,
          salePrice: 2850.0,
          quantity: 18,
          status: "ACTIVE",
          supplierKey: "SUP-000002",
        },
        {
          batchNumber: "RAB-EXP-DEMO",
          expiryDate: expiredDate, // Demonstration expired batch - system blocks sale!
          costPrice: 2100.0,
          salePrice: 2750.0,
          quantity: 4,
          status: "EXPIRED",
          supplierKey: "SUP-000002",
        },
      ],
    },
    {
      sku: "PET-RC-MAXI-15",
      barcode: "318255070701",
      name: "Royal Canin Maxi Adult Dog Food 15kg",
      genericName: "Balanced High-Digestibility Canine Kibble",
      categorySlug: "pet-food",
      subCategoryName: "Dry Dog Kibble",
      brandName: "Royal Canin",
      productType: "FEED",
      unit: "BAG",
      purchasePrice: 17500.0,
      salePrice: 21500.0,
      minStockThreshold: 4,
      reorderLevel: 8,
      prescriptionRequired: false,
      speciesList: ["Dog"],
      batches: [
        {
          batchNumber: "RC-MAX-901",
          expiryDate: futureExpiry2,
          costPrice: 17500.0,
          salePrice: 21500.0,
          quantity: 14,
          status: "ACTIVE",
          supplierKey: "SUP-000003",
        },
      ],
    },
    {
      sku: "PET-WHIS-CAT-3",
      barcode: "896400010505",
      name: "Whiskas Ocean Fish Adult Cat Food 3kg",
      genericName: "Omega-3 Fortified Feline Dry Food",
      categorySlug: "pet-food",
      subCategoryName: "Dry Cat Kibble",
      brandName: "Whiskas / Mars Petcare",
      productType: "FEED",
      unit: "BAG",
      purchasePrice: 2400.0,
      salePrice: 2950.0,
      minStockThreshold: 8,
      reorderLevel: 15,
      prescriptionRequired: false,
      speciesList: ["Cat"],
      batches: [
        {
          batchNumber: "WH-FISH-44",
          expiryDate: futureExpiry1,
          costPrice: 2400.0,
          salePrice: 2950.0,
          quantity: 26,
          status: "ACTIVE",
          supplierKey: "SUP-000003",
        },
      ],
    },
    {
      sku: "VET-OXY-20-100",
      barcode: "896400010606",
      name: "Oxytetracycline 20% LA Injection 100ml",
      genericName: "Oxytetracycline Long Acting",
      categorySlug: "antibiotics",
      subCategoryName: "Injectable Antibiotics",
      brandName: "Hilton Pharma Animal Health",
      productType: "MEDICINE",
      unit: "VIAL",
      purchasePrice: 680.0,
      salePrice: 900.0,
      minStockThreshold: 12,
      reorderLevel: 25,
      prescriptionRequired: true,
      speciesList: ["Cow", "Buffalo", "Sheep", "Goat"],
      medicineDetails: {
        strength: "200 mg/ml",
        dosageForm: "INJECTION",
        composition: "Oxytetracycline Base 200mg/ml with 2-pyrrolidone vehicle",
        withdrawalPeriod: "Meat: 28 days | Milk: 7 days",
        storageCondition: "Store below 25°C. Dark amber glass bottle.",
        regNumber: "065112-DVM",
      },
      batches: [
        {
          batchNumber: "OXY-9921",
          expiryDate: futureExpiry2,
          costPrice: 680.0,
          salePrice: 900.0,
          quantity: 50,
          status: "ACTIVE",
          supplierKey: "SUP-000001",
        },
      ],
    },
  ];

  for (const item of productsCatalog) {
    const category = dbCategories[item.categorySlug];
    const subCat = dbSubCategories[item.subCategoryName];
    const brand = dbBrands[item.brandName];

    const product = await prisma.product.upsert({
      where: { sku: item.sku },
      update: {},
      create: {
        sku: item.sku,
        barcode: item.barcode,
        name: item.name,
        genericName: item.genericName,
        categoryId: category.id,
        subCategoryId: subCat?.id,
        brandId: brand?.id,
        productType: item.productType,
        unit: item.unit,
        purchasePrice: item.purchasePrice,
        salePrice: item.salePrice,
        minStockThreshold: item.minStockThreshold,
        reorderLevel: item.reorderLevel,
        prescriptionRequired: item.prescriptionRequired,
        isBatchTracked: true,
      },
    });

    // Species association
    for (const spName of item.speciesList) {
      const sp = dbSpecies[spName];
      if (sp) {
        await prisma.productSpecies.upsert({
          where: { productId_speciesId: { productId: product.id, speciesId: sp.id } },
          update: {},
          create: { productId: product.id, speciesId: sp.id },
        });
      }
    }

    // Medicine details if applicable
    if (item.medicineDetails) {
      await prisma.medicineDetail.upsert({
        where: { productId: product.id },
        update: {},
        create: {
          productId: product.id,
          ...item.medicineDetails,
        },
      });
    }

    // Batches & Stock
    let totalStock = 0;
    for (const b of item.batches) {
      const supplier = dbSuppliers[b.supplierKey];
      const batch = await prisma.medicineBatch.upsert({
        where: { productId_batchNumber: { productId: product.id, batchNumber: b.batchNumber } },
        update: {},
        create: {
          productId: product.id,
          batchNumber: b.batchNumber,
          expiryDate: b.expiryDate,
          costPrice: b.costPrice,
          salePrice: b.salePrice,
          initialQuantity: b.quantity,
          currentQuantity: b.quantity,
          status: b.status,
          supplierId: supplier?.id,
        },
      });

      if (b.status === "ACTIVE") {
        totalStock += b.quantity;
      }

      // Initial Stock Movement Log
      await prisma.stockMovement.create({
        data: {
          branchId: mainBranch.id,
          productId: product.id,
          batchId: batch.id,
          movementType: "PURCHASE",
          quantity: b.quantity,
          previousStock: 0,
          newStock: b.quantity,
          referenceType: "INITIAL_INVENTORY_SETUP",
          userId: adminUser.id,
          notes: `Opening inventory initialization for batch ${b.batchNumber}`,
        },
      });
    }

    // ProductStock record for Branch
    await prisma.productStock.upsert({
      where: { productId_branchId: { productId: product.id, branchId: mainBranch.id } },
      update: { currentStock: totalStock },
      create: {
        productId: product.id,
        branchId: mainBranch.id,
        currentStock: totalStock,
      },
    });
  }
  console.log("✅ Products, Medicine Specs & Batches successfully seeded");

  // 12. Expense Categories
  const expenseCats = [
    { name: "Shop Rent", description: "Monthly commercial shop rent" },
    { name: "Electricity & Generator Backup", description: "WAPDA bills, solar battery, diesel fuel for vaccine refrigeration" },
    { name: "Staff Salaries", description: "Pharmacist, sales assistant, and cleaning staff wages" },
    { name: "Cold Chain Transport & Logistics", description: "Ice packs, thermocol boxes, vaccine delivery fees" },
    { name: "Stationery & Packaging", description: "Thermal receipt paper rolls, medicine pouches, labels" },
    { name: "Tea & Refreshments", description: "Daily customer & staff refreshments" },
  ];

  for (const ec of expenseCats) {
    await prisma.expenseCategory.upsert({
      where: { name: ec.name },
      update: {},
      create: ec,
    });
  }
  console.log("✅ Expense Categories seeded");

  // 13. Audit Log Sample
  await prisma.auditLog.create({
    data: {
      branchId: mainBranch.id,
      userId: adminUser.id,
      action: "SYSTEM_INITIALIZED",
      entity: "System",
      entityId: mainBranch.id,
      newValues: JSON.stringify({ message: "Enterprise ERP initial database seed completed successfully" }),
      ipAddress: "127.0.0.1",
    },
  });

  console.log("🎉 Seeding complete! Database is primed and ready for operation.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
