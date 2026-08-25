import type { TradeSignal } from "@/lib/trade";

export type UnitPriceTrend = {
  recentAvgUsdPerKg: number;
  baselineAvgUsdPerKg: number;
  changePercent: number;
};

/**
 * 관세청 월별 수입 데이터(총 수입액/총 수입중량)로 "평균 수입단가($/kg)"를 계산하고,
 * 최근 몇 개월과 그 이전을 비교해 원가가 오르는지 내리는지를 본다. "인기"가 아니라
 * "원가 경쟁력"을 직접 보여주는 신호라, 유행을 안 타는 꾸준한 마진 아이템도 잡을 수 있다.
 */
export function computeUnitPriceTrend(signal: TradeSignal): UnitPriceTrend | null {
  const withUnitPrice = signal.monthly
    .filter((m) => m.importWgt > 0)
    .map((m) => ({ yearMonth: m.yearMonth, unitPrice: m.importDlr / m.importWgt }));

  if (withUnitPrice.length < 4) return null;

  const recentWindow = withUnitPrice.slice(-2);
  const baselineWindow = withUnitPrice.slice(0, -2);

  const avg = (arr: { unitPrice: number }[]) =>
    arr.reduce((sum, p) => sum + p.unitPrice, 0) / arr.length;

  const recentAvgUsdPerKg = avg(recentWindow);
  const baselineAvgUsdPerKg = avg(baselineWindow);
  const changePercent =
    baselineAvgUsdPerKg > 0
      ? ((recentAvgUsdPerKg - baselineAvgUsdPerKg) / baselineAvgUsdPerKg) * 100
      : 0;

  return { recentAvgUsdPerKg, baselineAvgUsdPerKg, changePercent };
}
