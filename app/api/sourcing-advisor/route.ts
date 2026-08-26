import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeTrendDashboard } from "@/lib/trendDashboard";
import { generateSourcingRecommendations } from "@/lib/sourcingAdvisor";
import type { PriceGapItem } from "@/app/api/price-gap/route";

// 캐시에 예전 스키마(마진을 AI가 텍스트로 추정하던 버전)가 남아있으면 화면이 깨지니,
// 새 스키마(마진을 서버에서 직접 계산) 모양이 아니면 캐시를 무시하고 바로 재계산한다.
function isFreshSchema(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every((item) => {
      const record = item as Record<string, unknown>;
      return (
        record &&
        typeof record === "object" &&
        typeof record.koreaAvgPriceKrw === "number" &&
        typeof record.marginPercent === "number" &&
        typeof record.japanRetailPriceKrw === "number" &&
        "imageUrl" in record
      );
    })
  );
}

// AI가 웹 검색을 여러 번 하면서 답을 만들어서 기본 10초 제한으로는 부족함.
// 60초로도 타임아웃 나서(2026-08-25 실측) Fluid Compute 여유치까지 늘려본다 —
// 플랜에서 허용 안 하면 배포 자체가 거부되니 그때 다시 낮추면 됨.
export const maxDuration = 120;

const CACHE_ID = 1;
const CACHE_TTL_HOURS = 24;

// 임시: 마진 필터링 + 인증상품 제외 규칙이 실제로 반영됐는지 바로 확인하려고
// 캐시를 한 번 강제로 새로 계산시킨다. 확인 끝나면 이 상수와 조건은 지운다.
const FORCE_REFRESH_AFTER = new Date("2026-08-26T09:35:00Z");

export async function GET(req: Request) {
  try {
    const cached = await prisma.sourcingAdvisorCache.findUnique({
      where: { id: CACHE_ID },
    });
    const ageHours = cached
      ? (Date.now() - cached.generatedAt.getTime()) / (1000 * 60 * 60)
      : Infinity;
    const cachedRecommendations = cached
      ? JSON.parse(cached.recommendationsJson)
      : null;

    if (
      cached &&
      ageHours < CACHE_TTL_HOURS &&
      isFreshSchema(cachedRecommendations) &&
      cached.generatedAt > FORCE_REFRESH_AFTER
    ) {
      return NextResponse.json({
        recommendations: cachedRecommendations,
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
