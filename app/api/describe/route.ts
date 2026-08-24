import { NextRequest, NextResponse } from "next/server";
import { describeProductInKorean } from "@/lib/describe";
import type { RakutenItem } from "@/lib/rakuten";

export async function POST(req: NextRequest) {
  const { japanItem } = (await req.json()) as { japanItem: RakutenItem };

  if (!japanItem?.itemName) {
    return NextResponse.json({ error: "japanItem이 필요합니다." }, { status: 400 });
  }

  try {
    const description = await describeProductInKorean(japanItem);
    return NextResponse.json(description);
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
