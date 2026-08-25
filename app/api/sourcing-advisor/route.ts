import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeTrendDashboard } from "@/lib/trendDashboard";
import { generateSourcingRecommendations } from "@/lib/sourcingAdvisor";
import type { PriceGapItem } from "@/app/api/price-gap/route";

// AI가 웹 검색을 여러 번 하면서 답을 만들어서 기본 10초 제한으로는 부족함.
// 60초로도 타임아웃 나서(2026-08-25 실측) Fluid Compute 여유치까지 늘려본다 —
// 플랜에서 허용 안 하면 배포 자체가 거부되니 그때 다시 낮추면 됨.
export const maxDuration = 120;

const CACHE_ID = 1;
const CACHE_TTL_HOURS = 24;

export async function GET(req: Request) {
  try {
    const cached = await prisma.sourcingAdvisorCache.findUnique({
      where: { id: CACHE_ID },
    });
    const ageHours = cached
      ? (Date.now() - cached.generatedAt.getTime()) / (1000 * 60 * 60)
      : Infinity;

    if (cached && ageHours < CACHE_TTL_HOURS) {
      return NextResponse.json({
        recommendations: JSON.parse(cached.recommendationsJson),
        generatedAt: cached.generatedAt,
        cached: true,
      });
    }

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

    const cache = await prisma.sourcingAdvisorCache.upsert({
      where: { id: CACHE_ID },
      create: {
        id: CACHE_ID,
        recommendationsJson: JSON.stringify(recommendations),
      },
      update: {
        recommendationsJson: JSON.stringify(recommendations),
        generatedAt: new Date(),
      },
    });

    return NextResponse.json({
      recommendations,
      generatedAt: cache.generatedAt,
      cached: false,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
