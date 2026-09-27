import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId") || undefined;
    const speciesId = searchParams.get("speciesId") || undefined;

    const where: any = { deletedAt: null };
    if (customerId) where.customerId = customerId;
    if (speciesId) where.speciesId = speciesId;

    const pets = await prisma.pet.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        species: true,
      },
    });

    return NextResponse.json({ success: true, pets });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const pet = await prisma.pet.create({
      data: {
        customerId: body.customerId,
        name: body.name,
        speciesId: body.speciesId,
        breed: body.breed,
        gender: body.gender || "UNKNOWN",
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        weightKg: body.weightKg ? Number(body.weightKg) : null,
        color: body.color,
        microchipNumber: body.microchipNumber,
        allergies: body.allergies,
        medicalNotes: body.medicalNotes,
      },
      include: {
        customer: true,
        species: true,
      },
    });

    return NextResponse.json({ success: true, pet }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
