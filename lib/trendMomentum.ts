export type TrendPoint = { period: string; ratio: number };

export type MomentumResult = {
  recentAvg: number;
  baselineAvg: number;
  growthPercent: number;
  latestPartialRatio: number | null;
  /** 작년 같은 시기(약 52주 전) 평균. 데이터가 1년 이상 없으면 null. */
  yoyAvg: number | null;
  /** recentAvg를 작년 같은 시기와 비교한 증감율. 계절 자체의 흐름(예: 여름이라 다 같이 오름)은
   * 상쇄되고, "작년 이맘때보다 유독 더/덜 뜨는지"만 남는다. */
  yoyGrowthPercent: number | null;
};

/**
 * 네이버 트렌드 API는 최신 구간(마지막 주)이 아직 집계 중이라 항상 실제보다 낮게 나온다
 * (예: 대부분 키워드가 마지막 주에만 70~100대에서 갑자기 10~20대로 떨어짐 — 2026-08-25 실측
 * 확인). 그래서 증감율 계산에는 마지막 구간을 빼고, "최근 완결된 2주 평균" vs
 * "그 이전 평균"을 비교한다.
 *
 * points는 주간(week) 단위로, 최소 3개월(단기 비교용) ~ 최대 약 14개월(YoY 비교용)까지
 * 들어올 수 있다고 가정한다. 배열 길이가 짧으면(YoY용 과거 데이터가 없으면) yoyAvg/
 * yoyGrowthPercent는 null.
 */
export function computeMomentum(points: TrendPoint[]): MomentumResult | null {
  if (points.length < 4) return null;

  const latestPartial = points[points.length - 1];
  const complete = points.slice(0, -1);
  const recentWindow = complete.slice(-2);
  const baselineWindow = complete.slice(-14, -2);
  if (baselineWindow.length === 0) return null;

  const avg = (arr: TrendPoint[]) =>
    arr.reduce((sum, p) => sum + p.ratio, 0) / arr.length;

  const recentAvg = avg(recentWindow);
  const baselineAvg = avg(baselineWindow);
  const growthPercent =
    baselineAvg > 0 ? ((recentAvg - baselineAvg) / baselineAvg) * 100 : 0;

  const yoyWindow = complete.slice(-56, -54);
  const yoyAvg = yoyWindow.length > 0 ? avg(yoyWindow) : null;
  const yoyGrowthPercent =
    yoyAvg !== null && yoyAvg > 0 ? ((recentAvg - yoyAvg) / yoyAvg) * 100 : null;

  return {
    recentAvg,
    baselineAvg,
    growthPercent,
    latestPartialRatio: latestPartial?.ratio ?? null,
    yoyAvg,
    yoyGrowthPercent,
  };
}
