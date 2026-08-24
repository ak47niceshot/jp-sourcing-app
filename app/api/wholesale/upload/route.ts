import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseWholesaleCsv } from "@/lib/wholesaleCsv";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");
  const source = (formData.get("source") as string) || "슈퍼딜리버리";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file이 필요합니다." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const { rows, skipped, detectedHeaders } = parseWholesaleCsv(buffer);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "파싱된 상품이 없어요. CSV 형식을 확인해주세요." },
        { status: 400 }
      );
    }

    await prisma.wholesaleItem.createMany({
      data: rows.map((row) => ({
        source,
        productName: row.productName,
        code: row.code,
        wholesalePriceJpy: row.wholesalePriceJpy,
        referencePriceJpy: row.referencePriceJpy,
        rawJson: JSON.stringify(row.raw),
      })),
    });

    return NextResponse.json({
      imported: rows.length,
      skipped,
      detectedHeaders,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
