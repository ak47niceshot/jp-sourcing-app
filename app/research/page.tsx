"use client";

import { useState } from "react";
import { calculateMargin, MarginInputs, MarginResult } from "@/lib/margin";
import { suggestHsCodes } from "@/lib/hsCodes";
import type { TradeSignal } from "@/lib/trade";
import type { RakutenItem } from "@/lib/rakuten";

type ResearchResponse = {
  tradeSignal: TradeSignal;
  fxRate: number;
  japanCandidates: { keyword: string; items: RakutenItem[] } | null;
};

const DEFAULT_MARGIN_INPUTS: Omit<MarginInputs, "priceJpy" | "fxRate"> = {
  shippingKrw: 5000,
  customsDutyPercent: 8,
  vatPercent: 10,
  platformFeePercent: 10,
  targetSalePriceKrw: 0,
};

const EMPTY_JAPAN_ITEM: RakutenItem = {
  itemName: "",
  itemUrl: "",
  imageUrl: "",
  priceJpy: 0,
  shopName: "",
  reviewCount: 0,
  reviewAverage: 0,
};

export default function ResearchPage() {
  const [keyword, setKeyword] = useState("");
  const [hsCode, setHsCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResearchResponse | null>(null);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [japanItem, setJapanItem] = useState<RakutenItem>(EMPTY_JAPAN_ITEM);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [marginInputs, setMarginInputs] = useState<MarginInputs | null>(null);
  const [aiComment, setAiComment] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const hsSuggestions = suggestHsCodes(keyword);

  const marginResult: MarginResult | null = marginInputs
    ? calculateMargin(marginInputs)
    : null;

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!hsCode.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setSelectedIndex(null);
    setShowManualEntry(false);
    setJapanItem(EMPTY_JAPAN_ITEM);
    setMarginInputs(null);
    setAiComment(null);
    setSaveMessage(null);

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, hsCode }),
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
    if (!result?.japanCandidates) return;
    const item = result.japanCandidates.items[index];
    setSelectedIndex(index);
    setShowManualEntry(false);
    setJapanItem(item);
    startMargin(item);
  }

  function updateJapanItem<K extends keyof RakutenItem>(key: K, value: RakutenItem[K]) {
    setJapanItem((prev) => ({ ...prev, [key]: value }));
  }

  function startMargin(item: RakutenItem) {
    if (!result || !item.itemName.trim() || item.priceJpy <= 0) return;
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
    if (!result || !marginInputs || !marginResult) return;
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword,
          tradeSignal: result.tradeSignal,
          japanItem,
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
    if (!result || !marginInputs || !marginResult) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword,
          hsCode,
          tradeSignal: result.tradeSignal,
          japanItem,
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
      <form onSubmit={handleSearch} className="flex flex-col gap-3">
        <div className="flex gap-2">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="예: 휴대용 선풍기, 화장품, 문구류..."
            className="flex-1 border border-black/15 dark:border-white/20 rounded px-3 py-2 bg-transparent"
          />
          <input
            value={hsCode}
            onChange={(e) => setHsCode(e.target.value)}
            placeholder="HS코드 (예: 841451)"
            className="w-48 border border-black/15 dark:border-white/20 rounded px-3 py-2 bg-transparent"
          />
          <button
            type="submit"
            disabled={loading || !hsCode.trim()}
            className="px-4 py-2 rounded bg-foreground text-background text-sm font-medium disabled:opacity-50"
          >
            {loading ? "검색 중..." : "검색"}
          </button>
        </div>

        {hsSuggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="opacity-60 self-center">추천 HS코드:</span>
            {hsSuggestions.map((s) => (
              <button
                key={s.code}
                type="button"
                onClick={() => setHsCode(s.code)}
                className={`px-2 py-1 rounded border ${
                  hsCode === s.code
                    ? "border-foreground bg-black/5 dark:bg-white/10"
                    : "border-black/15 dark:border-white/20"
                }`}
              >
                {s.label} ({s.code})
              </button>
            ))}
          </div>
        )}
      </form>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {result && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="border border-black/10 dark:border-white/10 rounded p-4">
            <h2 className="font-semibold mb-1">
              한국의 대일본 수입 통계 (관세청)
            </h2>
            <p className="text-xs opacity-50 mb-3">
              HS코드 {result.tradeSignal.hsCode} · {result.tradeSignal.periodFrom}~
              {result.tradeSignal.periodTo}
            </p>
            <dl className="grid grid-cols-2 gap-y-1 text-sm mb-4">
              <dt className="opacity-60">총 수입액</dt>
              <dd>${result.tradeSignal.totalImportDlr.toLocaleString()}</dd>
              <dt className="opacity-60">총 수입 중량</dt>
              <dd>{result.tradeSignal.totalImportWgt.toLocaleString()} kg</dd>
              <dt className="opacity-60">현재 환율</dt>
              <dd>1엔 = {result.fxRate}원</dd>
            </dl>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs max-h-40 overflow-y-auto">
              {result.tradeSignal.monthly.map((m) => (
                <li key={m.yearMonth} className="opacity-70">
                  {m.yearMonth}: ${m.importDlr.toLocaleString()}
                </li>
              ))}
            </ul>
          </section>

          <section className="border border-black/10 dark:border-white/10 rounded p-4">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="font-semibold">일본 소싱 후보 (라쿠텐)</h2>
              <button
                onClick={() => {
                  setShowManualEntry(true);
                  setSelectedIndex(null);
                  setJapanItem(EMPTY_JAPAN_ITEM);
                }}
                className="text-xs underline opacity-70 hover:opacity-100"
              >
                직접 입력할게요
              </button>
            </div>

            {result.japanCandidates && result.japanCandidates.items.length > 0 ? (
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
            ) : (
              <p className="text-xs opacity-50">
                {keyword.trim()
                  ? "검색 결과가 없어요. 다른 키워드로 다시 검색하거나 직접 입력해주세요."
                  : "키워드를 입력하고 검색하면 라쿠텐 후보가 여기 나와요."}
              </p>
            )}

            {showManualEntry && (
              <div className="mt-4 border-t border-black/10 dark:border-white/10 pt-3">
                <div className="grid grid-cols-1 gap-3 text-sm mb-3">
                  <label className="flex flex-col gap-1">
                    상품명
                    <input
                      value={japanItem.itemName}
                      onChange={(e) => updateJapanItem("itemName", e.target.value)}
                      className="border border-black/15 dark:border-white/20 rounded px-2 py-1 bg-transparent"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    판매가 (엔)
                    <input
                      type="number"
                      value={japanItem.priceJpy || ""}
                      onChange={(e) => updateJapanItem("priceJpy", Number(e.target.value))}
                      className="border border-black/15 dark:border-white/20 rounded px-2 py-1 bg-transparent"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    URL
                    <input
                      value={japanItem.itemUrl}
                      onChange={(e) => updateJapanItem("itemUrl", e.target.value)}
                      placeholder="https://..."
                      className="border border-black/15 dark:border-white/20 rounded px-2 py-1 bg-transparent"
                    />
                  </label>
                </div>
                <button
                  onClick={() => startMargin(japanItem)}
                  disabled={!japanItem.itemName.trim() || japanItem.priceJpy <= 0}
                  className="px-4 py-2 rounded border border-black/20 dark:border-white/20 text-sm disabled:opacity-50"
                >
                  마진 계산하기
                </button>
              </div>
            )}
          </section>
        </div>
      )}

      {marginInputs && marginResult && (
        <section className="border border-black/10 dark:border-white/10 rounded p-4">
          <h2 className="font-semibold mb-3">
            마진 계산기 — {japanItem.itemName}
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
