import { NextResponse } from "next/server";
import { fetchShoppingKeywordTrend } from "@/lib/naverShoppingInsight";
import { SHOPPING_CATEGORIES } from "@/lib/naverShoppingCategories";
import { SHOPPING_KEYWORDS_BY_CATEGORY } from "@/lib/naverShoppingKeywords";
import { computeMomentum } from "@/lib/trendMomentum";

export type TrendDashboardItem = {
  keyword: string;
  categoryCode: string;
  categoryLabel: string;
  recentAvg: number;
  baselineAvg: number;
  growthPercent: number;
};

export async function GET() {
  const categoryLabelByCode = new Map(
    SHOPPING_CATEGORIES.map((c) => [c.code, c.label])
  );

  const jobs = Object.entries(SHOPPING_KEYWORDS_BY_CATEGORY).flatMap(
    ([categoryCode, keywords]) =>
      keywords.map((keyword) => ({ categoryCode, keyword }))
  );

  try {
    const results = await Promise.all(
      jobs.map(async ({ categoryCode, keyword }) => {
        const trend = await fetchShoppingKeywordTrend(categoryCode, keyword);
        const momentum = computeMomentum(trend.points);
        if (!momentum) return null;
        return {
          keyword,
          categoryCode,
          categoryLabel: categoryLabelByCode.get(categoryCode) ?? categoryCode,
          recentAvg: momentum.recentAvg,
          baselineAvg: momentum.baselineAvg,
          growthPercent: momentum.growthPercent,
        } satisfies TrendDashboardItem;
      })
    );

    const items = results
      .filter((r): r is TrendDashboardItem => r !== null)
      .sort((a, b) => b.growthPercent - a.growthPercent);

    return NextResponse.json({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
