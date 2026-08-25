export type TrendPoint = { period: string; ratio: number };

export type MomentumResult = {
  recentAvg: number;
  baselineAvg: number;
  growthPercent: number;
  latestPartialRatio: number | null;
};

/**
 * 네이버 트렌드 API는 최신 구간(마지막 주)이 아직 집계 중이라 항상 실제보다 낮게 나온다
 * (예: 대부분 키워드가 마지막 주에만 70~100대에서 갑자기 10~20대로 떨어짐 — 2026-08-25 실측
 * 확인). 그래서 증감율 계산에는 마지막 구간을 빼고, "최근 완결된 2주 평균" vs
 * "그 이전 평균"을 비교한다. 데이터가 4주 미만이면 계산하지 않는다(null).
 */
export function computeMomentum(points: TrendPoint[]): MomentumResult | null {
  if (points.length < 4) return null;

  const latestPartial = points[points.length - 1];
  const complete = points.slice(0, -1);
  const recentWindow = complete.slice(-2);
  const baselineWindow = complete.slice(0, -2);
  if (baselineWindow.length === 0) return null;

  const avg = (arr: TrendPoint[]) =>
    arr.reduce((sum, p) => sum + p.ratio, 0) / arr.length;

  const recentAvg = avg(recentWindow);
  const baselineAvg = avg(baselineWindow);
  const growthPercent =
    baselineAvg > 0 ? ((recentAvg - baselineAvg) / baselineAvg) * 100 : 0;

  return {
    recentAvg,
    baselineAvg,
    growthPercent,
    latestPartialRatio: latestPartial?.ratio ?? null,
  };
}
