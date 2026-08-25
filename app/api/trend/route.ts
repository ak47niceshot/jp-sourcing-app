import { NextRequest, NextResponse } from "next/server";
import { fetchShoppingCategoryTrend } from "@/lib/naverShoppingInsight";

export async function POST(req: NextRequest) {
  const { categoryName, categoryCode } = await req.json();

  if (!categoryName || !categoryCode) {
    return NextResponse.json(
      { error: "categoryName, categoryCode가 필요합니다." },
      { status: 400 }
    );
  }

  try {
    const trend = await fetchShoppingCategoryTrend(categoryName, categoryCode);
    return NextResponse.json(trend);
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
