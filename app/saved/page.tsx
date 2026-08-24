import { prisma } from "@/lib/prisma";
import type { TradeSignal } from "@/lib/trade";
import type { RakutenItem } from "@/lib/rakuten";
import type { MarginResult } from "@/lib/margin";

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
      <h1 className="text-xl font-semibold">저장한 후보</h1>

      {items.length === 0 && (
        <p className="text-sm opacity-60">아직 저장한 후보가 없어요.</p>
      )}

      <ul className="flex flex-col gap-4">
        {items.map((item) => (
          <li
            key={item.id}
            className="border border-black/10 dark:border-white/10 rounded p-4"
          >
            <div className="flex items-baseline justify-between mb-2">
              <h2 className="font-medium">
                {item.keyword} <span className="opacity-50 text-xs">HS {item.hsCode}</span>
              </h2>
              <span className="text-xs opacity-50">
                {new Date(item.createdAt).toLocaleString("ko-KR")}
              </span>
            </div>
            <div className="flex gap-3 mb-2">
              {item.japanItem.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.japanItem.imageUrl}
                  alt=""
                  className="w-12 h-12 object-cover rounded shrink-0"
                />
              )}
              <p className="text-sm self-center">{item.japanItem.itemName}</p>
            </div>
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-y-1 text-sm mb-2">
              <dt className="opacity-60">대일본 수입액</dt>
              <dd>${item.tradeSignal.totalImportDlr.toLocaleString()}</dd>
              <dt className="opacity-60">대일본 수입중량</dt>
              <dd>{item.tradeSignal.totalImportWgt.toLocaleString()} kg</dd>
              <dt className="opacity-60">예상 마진액</dt>
              <dd className={item.marginResult.marginKrw < 0 ? "text-red-500" : ""}>
                {Math.round(item.marginResult.marginKrw).toLocaleString()}원
              </dd>
              <dt className="opacity-60">예상 마진율</dt>
              <dd className={item.marginResult.marginPercent < 0 ? "text-red-500" : ""}>
                {item.marginResult.marginPercent.toFixed(1)}%
              </dd>
            </dl>
            {item.aiComment && (
              <div className="text-xs bg-black/5 dark:bg-white/10 rounded p-2 whitespace-pre-wrap">
                {item.aiComment}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
