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
  yoyGrowthPercent: number | null;
};

// YoY(작년 같은 시기) 비교를 하려면 대략 14개월치 주간 데이터가 필요하다.
function yoyLookbackStartDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 400);
  return d.toISOString().slice(0, 10);
}

export async function computeTrendDashboard(): Promise<TrendDashboardItem[]> {
  const categoryLabelByCode = new Map(
    SHOPPING_CATEGORIES.map((c) => [c.code, c.label])
  );

  const jobs = Object.entries(SHOPPING_KEYWORDS_BY_CATEGORY).flatMap(
    ([categoryCode, keywords]) =>
      keywords.map((keyword) => ({ categoryCode, keyword }))
  );

  const startDate = yoyLookbackStartDate();

  const results = await Promise.all(
    jobs.map(async ({ categoryCode, keyword }) => {
      const trend = await fetchShoppingKeywordTrend(categoryCode, keyword, {
        startDate,
      });
      const momentum = computeMomentum(trend.points);
      if (!momentum) return null;
      return {
        keyword,
        categoryCode,
        categoryLabel: categoryLabelByCode.get(categoryCode) ?? categoryCode,
        recentAvg: momentum.recentAvg,
        baselineAvg: momentum.baselineAvg,
        growthPercent: momentum.growthPercent,
        yoyGrowthPercent: momentum.yoyGrowthPercent,
      } satisfies TrendDashboardItem;
    })
  );

  // YoY(작년 같은 시기 대비) 증감이 있으면 그걸 우선한다 — 계절 자체의 흐름은 상쇄되고
  // "작년 이맘때보다 유독 더 뜨는지"만 남아서, 단순 최근 증감보다 덜 뻔한 신호가 된다.
  return results
    .filter((r): r is TrendDashboardItem => r !== null)
    .sort(
      (a, b) =>
        (b.yoyGrowthPercent ?? b.growthPercent) -
        (a.yoyGrowthPercent ?? a.growthPercent)
    );
}
