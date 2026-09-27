import { NextRequest, NextResponse } from "next/server";
import { getProducts, createProduct, findProductByBarcodeOrSku } from "@/services/product.service";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const barcode = searchParams.get("barcode");

    if (barcode) {
      const product = await findProductByBarcodeOrSku(barcode);
      return NextResponse.json({ success: true, product });
    }

    const search = searchParams.get("search") || undefined;
    const categoryId = searchParams.get("categoryId") || undefined;
    const productType = searchParams.get("productType") || undefined;
    const speciesId = searchParams.get("speciesId") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const data = await getProducts({ search, categoryId, productType, speciesId, page, limit });
    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session, "products.create_update")) {
      return NextResponse.json({ success: false, error: "Unauthorized access." }, { status: 403 });
    }

    const body = await req.json();
    const product = await createProduct(body, session.id, session.branchId);

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
