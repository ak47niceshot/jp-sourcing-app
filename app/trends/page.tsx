"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { suggestHsCodes } from "@/lib/hsCodes";
import type { TrendDashboardItem } from "@/app/api/trend-dashboard/route";

export default function TrendsPage() {
  const [items, setItems] = useState<TrendDashboardItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/trend-dashboard");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "요청 실패");
        if (!cancelled) setItems(data.items);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "알 수 없는 오류");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold mb-1">동향 — 지금 뜨는 순위</h1>
        <p className="text-sm opacity-60">
          네이버 쇼핑인사이트 기준, 최근 완결된 2주 평균을 그 이전 평균과 비교한 증감율
          순위예요. 상품명·가격은 안 나와요 — 클릭하면 리서치 화면으로 넘어가서 라쿠텐
          후보를 바로 찾아드려요.
        </p>
      </div>

      <section className="border border-black/10 dark:border-white/10 rounded p-4">
        {loading && <p className="text-xs opacity-50">순위 계산 중...</p>}
        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        {items && items.length === 0 && (
          <p className="text-xs opacity-50">계산할 데이터가 없어요.</p>
        )}
        {items && items.length > 0 && (
          <ol className="flex flex-col gap-1.5">
            {items.map((item, i) => {
              const matchedHsCode = suggestHsCodes(item.keyword)[0]?.code ?? "";
              const href = matchedHsCode
                ? `/research?keyword=${encodeURIComponent(item.keyword)}&hsCode=${encodeURIComponent(matchedHsCode)}`
                : `/research?keyword=${encodeURIComponent(item.keyword)}`;
              return (
                <li key={`${item.categoryCode}-${item.keyword}`}>
                  <Link
                    href={href}
                    className="w-full flex items-center gap-3 text-left text-sm rounded border border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30 px-3 py-2 transition"
                  >
                    <span className="w-5 shrink-0 opacity-40 text-xs">{i + 1}</span>
                    <span className="flex-1">
                      <span className="font-medium">{item.keyword}</span>
                      <span className="text-xs opacity-50 ml-2">{item.categoryLabel}</span>
                    </span>
                    <span className="text-xs opacity-50 w-16 text-right">
                      인기 {item.recentAvg.toFixed(0)}
                    </span>
                    <span
                      className={`text-xs font-semibold w-16 text-right ${
                        item.growthPercent >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {item.growthPercent >= 0 ? "▲" : "▼"}
                      {Math.abs(item.growthPercent).toFixed(0)}%
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
