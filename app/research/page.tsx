"use client";

import { useState } from "react";
import { calculateMargin, MarginInputs, MarginResult } from "@/lib/margin";
import type { KoreaSignal } from "@/lib/naver";
import type { RakutenItem } from "@/lib/rakuten";

type ResearchResponse = {
  koreaSignal: KoreaSignal;
  japanCandidates: { keyword: string; items: RakutenItem[] };
  fxRate: number;
};

const DEFAULT_MARGIN_INPUTS: Omit<MarginInputs, "priceJpy" | "fxRate"> = {
  shippingKrw: 5000,
  customsDutyPercent: 8,
  vatPercent: 10,
  platformFeePercent: 10,
  targetSalePriceKrw: 0,
};

export default function ResearchPage() {
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResearchResponse | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [marginInputs, setMarginInputs] = useState<MarginInputs | null>(null);
  const [aiComment, setAiComment] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const selectedItem =
    result && selectedIndex !== null
      ? result.japanCandidates.items[selectedIndex]
      : null;

  const marginResult: MarginResult | null = marginInputs
    ? calculateMargin(marginInputs)
    : null;

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setSelectedIndex(null);
    setMarginInputs(null);
    setAiComment(null);
    setSaveMessage(null);

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "요청 실패");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  }

  function handleSelectItem(index: number) {
    if (!result) return;
    const item = result.japanCandidates.items[index];
    setSelectedIndex(index);
    setAiComment(null);
    setSaveMessage(null);
    setMarginInputs({
      priceJpy: item.priceJpy,
      fxRate: result.fxRate,
      ...DEFAULT_MARGIN_INPUTS,
      targetSalePriceKrw: Math.round(item.priceJpy * result.fxRate * 1.6),
    });
  }

  function updateMarginInput(key: keyof MarginInputs, value: number) {
    setMarginInputs((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function handleAnalyze() {
    if (!result || !selectedItem || !marginInputs || !marginResult) return;
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword,
          koreaSignal: result.koreaSignal,
          japanItem: selectedItem,
          marginInputs,
          marginResult,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "AI 분석 실패");
      setAiComment(data.comment);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSave() {
    if (!result || !selectedItem || !marginInputs || !marginResult) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword,
          koreaSignal: result.koreaSignal,
          japanItem: selectedItem,
          marginInputs,
          marginResult,
          aiComment,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "저장 실패");
      setSaveMessage("저장했어요.");
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="예: 휴대용 선풍기, 목욕용품, 문구류..."
          className="flex-1 border border-black/15 dark:border-white/20 rounded px-3 py-2 bg-transparent"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded bg-foreground text-background text-sm font-medium disabled:opacity-50"
        >
          {loading ? "검색 중..." : "검색"}
        </button>
      </form>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {result && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="border border-black/10 dark:border-white/10 rounded p-4">
            <h2 className="font-semibold mb-3">한국 시장 시그널 (네이버 쇼핑)</h2>
            <dl className="grid grid-cols-2 gap-y-1 text-sm mb-4">
              <dt className="opacity-60">판매처 수</dt>
              <dd>{result.koreaSignal.totalSellers}</dd>
              <dt className="opacity-60">최저가</dt>
              <dd>{result.koreaSignal.minPrice.toLocaleString()}원</dd>
              <dt className="opacity-60">최고가</dt>
              <dd>{result.koreaSignal.maxPrice.toLocaleString()}원</dd>
              <dt className="opacity-60">평균가</dt>
              <dd>{result.koreaSignal.avgPrice.toLocaleString()}원</dd>
            </dl>
            <ul className="flex flex-col gap-2 max-h-80 overflow-y-auto">
              {result.koreaSignal.items.slice(0, 10).map((item, i) => (
                <li key={i} className="text-xs border-t border-black/5 dark:border-white/10 pt-2">
                  <a href={item.link} target="_blank" rel="noreferrer" className="hover:underline">
                    {item.title}
                  </a>
                  <div className="opacity-60">
                    {item.mallName} · {item.lprice.toLocaleString()}원
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="border border-black/10 dark:border-white/10 rounded p-4">
            <h2 className="font-semibold mb-3">일본 소싱 후보 (라쿠텐)</h2>
            <ul className="flex flex-col gap-2 max-h-96 overflow-y-auto">
              {result.japanCandidates.items.map((item, i) => (
                <li key={i}>
                  <button
                    onClick={() => handleSelectItem(i)}
                    className={`w-full text-left text-xs rounded border px-3 py-2 transition ${
                      selectedIndex === i
                        ? "border-foreground bg-black/5 dark:bg-white/10"
                        : "border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30"
                    }`}
                  >
                    <div className="font-medium line-clamp-2">{item.itemName}</div>
                    <div className="opacity-60 mt-1">
                      {item.shopName} · {item.priceJpy.toLocaleString()}엔 · 리뷰{" "}
                      {item.reviewCount}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      {selectedItem && marginInputs && marginResult && (
        <section className="border border-black/10 dark:border-white/10 rounded p-4">
          <h2 className="font-semibold mb-3">
            마진 계산기 — {selectedItem.itemName}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
            <label className="flex flex-col gap-1">
              환율 (1엔 = ?원)
              <input
                type="number"
                step="0.01"
                value={marginInputs.fxRate}
                onChange={(e) => updateMarginInput("fxRate", Number(e.target.value))}
                className="border border-black/15 dark:border-white/20 rounded px-2 py-1 bg-transparent"
              />
            </label>
            <label className="flex flex-col gap-1">
              국제 배송비 (원)
              <input
                type="number"
                value={marginInputs.shippingKrw}
                onChange={(e) => updateMarginInput("shippingKrw", Number(e.target.value))}
                className="border border-black/15 dark:border-white/20 rounded px-2 py-1 bg-transparent"
              />
            </label>
            <label className="flex flex-col gap-1">
              관세율 (%)
              <input
                type="number"
                value={marginInputs.customsDutyPercent}
                onChange={(e) => updateMarginInput("customsDutyPercent", Number(e.target.value))}
                className="border border-black/15 dark:border-white/20 rounded px-2 py-1 bg-transparent"
              />
            </label>
            <label className="flex flex-col gap-1">
              부가세율 (%)
              <input
                type="number"
                value={marginInputs.vatPercent}
                onChange={(e) => updateMarginInput("vatPercent", Number(e.target.value))}
                className="border border-black/15 dark:border-white/20 rounded px-2 py-1 bg-transparent"
              />
            </label>
            <label className="flex flex-col gap-1">
              플랫폼 수수료율 (%)
              <input
                type="number"
                value={marginInputs.platformFeePercent}
                onChange={(e) => updateMarginInput("platformFeePercent", Number(e.target.value))}
                className="border border-black/15 dark:border-white/20 rounded px-2 py-1 bg-transparent"
              />
            </label>
            <label className="flex flex-col gap-1">
              목표 판매가 (원)
              <input
                type="number"
                value={marginInputs.targetSalePriceKrw}
                onChange={(e) => updateMarginInput("targetSalePriceKrw", Number(e.target.value))}
                className="border border-black/15 dark:border-white/20 rounded px-2 py-1 bg-transparent"
              />
            </label>
          </div>

          <dl className="grid grid-cols-2 md:grid-cols-4 gap-y-1 text-sm mb-4 border-t border-black/10 dark:border-white/10 pt-3">
            <dt className="opacity-60">원가(KRW 환산)</dt>
            <dd>{Math.round(marginResult.costKrw).toLocaleString()}원</dd>
            <dt className="opacity-60">관/부가세 반영 원가</dt>
            <dd>{Math.round(marginResult.landedCostKrw).toLocaleString()}원</dd>
            <dt className="opacity-60">마진액</dt>
            <dd className={marginResult.marginKrw < 0 ? "text-red-500" : ""}>
              {Math.round(marginResult.marginKrw).toLocaleString()}원
            </dd>
            <dt className="opacity-60">마진율</dt>
            <dd className={marginResult.marginPercent < 0 ? "text-red-500" : ""}>
              {marginResult.marginPercent.toFixed(1)}%
            </dd>
          </dl>

          <div className="flex gap-2 mb-4">
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="px-4 py-2 rounded border border-black/20 dark:border-white/20 text-sm disabled:opacity-50"
            >
              {analyzing ? "분석 중..." : "AI 분석"}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded bg-foreground text-background text-sm disabled:opacity-50"
            >
              {saving ? "저장 중..." : "이 후보 저장"}
            </button>
            {saveMessage && <span className="text-sm self-center opacity-70">{saveMessage}</span>}
          </div>

          {aiComment && (
            <div className="text-sm bg-black/5 dark:bg-white/10 rounded p-3 whitespace-pre-wrap">
              {aiComment}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
