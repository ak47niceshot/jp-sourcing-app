import { NextResponse } from "next/server";
import { computeTrendDashboard } from "@/lib/trendDashboard";
import { generateSourcingRecommendations } from "@/lib/sourcingAdvisor";
import type { PriceGapItem } from "@/app/api/price-gap/route";

export async function GET(req: Request) {
  try {
    const trendItems = await computeTrendDashboard();

    // price-gap은 같은 배포 안의 라우트를 내부적으로 다시 호출 — 로직 재사용을 위해
    // 절대 URL로 자기 자신을 호출한다 (Vercel에서도 안전하게 동작).
    const origin = new URL(req.url).origin;
    let priceGapItems: PriceGapItem[] = [];
    try {
      const res = await fetch(`${origin}/api/price-gap`, { cache: "no-store" });
      const data = await res.json();
      if (res.ok) priceGapItems = data.items;
    } catch {
      // 가격 신호 없이도 추천은 가능하니 실패해도 계속 진행
    }

    const recommendations = await generateSourcingRecommendations(
      trendItems,
      priceGapItems
    );

    return NextResponse.json({ recommendations });
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
