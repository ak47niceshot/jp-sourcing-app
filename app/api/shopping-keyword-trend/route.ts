import { NextRequest, NextResponse } from "next/server";
import { fetchShoppingKeywordTrend } from "@/lib/naverShoppingInsight";

export async function POST(req: NextRequest) {
  const { categoryCode, keyword } = await req.json();

  if (!categoryCode || !keyword) {
    return NextResponse.json(
      { error: "categoryCode, keyword가 필요합니다." },
      { status: 400 }
    );
  }

  try {
    const trend = await fetchShoppingKeywordTrend(categoryCode, keyword);
    return NextResponse.json(trend);
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
