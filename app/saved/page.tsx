import { prisma } from "@/lib/prisma";
import type { TradeSignal } from "@/lib/trade";
import type { RakutenItem } from "@/lib/rakuten";
import type { MarginResult } from "@/lib/margin";

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const rows = await prisma.savedCandidate.findMany({
    orderBy: { createdAt: "desc" },
  });

  const items = rows.map((row) => ({
    id: row.id,
    keyword: row.keyword,
    hsCode: row.hsCode,
    tradeSignal: JSON.parse(row.tradeSignalJson) as TradeSignal,
    japanItem: JSON.parse(row.japanCandidateJson) as RakutenItem,
    marginResult: JSON.parse(row.marginResultJson) as MarginResult,
    aiComment: row.aiComment,
    createdAt: row.createdAt,
  }));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">저장한 후보</h1>

      {items.length === 0 && (
        <p className="text-sm opacity-60">아직 저장한 후보가 없어요.</p>
      )}

      <ul className="flex flex-col gap-4">
        {items.map((item) => {
          const isLoss = item.marginResult.marginPercent < 0;
          return (
            <li
              key={item.id}
              className="border border-black/10 dark:border-white/10 rounded-xl p-4 hover:border-blue-500/30 transition"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex gap-3 min-w-0">
                  {item.japanItem.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.japanItem.imageUrl}
                      alt=""
                      className="w-14 h-14 object-cover rounded-lg shrink-0 border border-black/10 dark:border-white/10"
                    />
                  )}
                  <div className="min-w-0">
                    <h2 className="font-semibold truncate">
                      {item.keyword}{" "}
                      <span className="opacity-50 text-xs font-normal">HS {item.hsCode}</span>
                    </h2>
                    <p className="text-xs mt-0.5 truncate">
                      {item.japanItem.itemUrl ? (
                        <a
                          href={item.japanItem.itemUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="opacity-70 hover:opacity-100 hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                        >
                          {item.japanItem.itemName} ↗
                        </a>
                      ) : (
                        <span className="opacity-70">{item.japanItem.itemName}</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div
                    className={`text-2xl font-black leading-none ${
                      isLoss
                        ? "text-red-600 dark:text-red-400"
                        : "text-blue-600 dark:text-blue-400"
                    }`}
                  >
                    {item.marginResult.marginPercent.toFixed(1)}%
                  </div>
                  <div
                    className={`text-xs font-medium mt-1 ${
                      isLoss ? "text-red-600 dark:text-red-400" : "opacity-60"
                    }`}
                  >
                    {Math.round(item.marginResult.marginKrw).toLocaleString()}원 마진
                  </div>
                </div>
              </div>

              <dl className="grid grid-cols-2 md:grid-cols-3 gap-y-1 gap-x-4 text-xs border-t border-black/5 dark:border-white/10 pt-2">
                <dt className="opacity-50">대일본 수입액</dt>
                <dd className="text-right md:text-left">
                  ${item.tradeSignal.totalImportDlr.toLocaleString()}
                </dd>
                <dt className="opacity-50">대일본 수입중량</dt>
                <dd className="text-right md:text-left">
                  {item.tradeSignal.totalImportWgt.toLocaleString()} kg
                </dd>
                <dt className="opacity-50">라쿠텐 원가</dt>
                <dd className="text-right md:text-left">
                  {item.japanItem.priceJpy.toLocaleString()}엔 (≈
                  {Math.round(item.marginResult.costKrw).toLocaleString()}원)
                </dd>
              </dl>

              {item.aiComment && (
                <div className="text-xs bg-blue-500/5 dark:bg-blue-400/10 border border-blue-500/10 rounded-lg p-2.5 mt-3 whitespace-pre-wrap">
                  {item.aiComment}
                </div>
              )}

              <div className="text-[11px] opacity-40 mt-2 text-right">
                {new Date(item.createdAt).toLocaleString("ko-KR")}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
