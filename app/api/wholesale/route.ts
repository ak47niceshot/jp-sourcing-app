import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const keyword = req.nextUrl.searchParams.get("keyword")?.trim();

  const items = await prisma.wholesaleItem.findMany({
    where: keyword
      ? { productName: { contains: keyword } }
      : undefined,
    orderBy: { uploadedAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ items });
}

export async function DELETE() {
  await prisma.wholesaleItem.deleteMany();
  return NextResponse.json({ ok: true });
}
