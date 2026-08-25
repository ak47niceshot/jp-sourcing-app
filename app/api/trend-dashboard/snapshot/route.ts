import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeTrendDashboard } from "@/lib/trendDashboard";

const MIN_DAYS_BETWEEN_SNAPSHOTS = 6;

/**
 * "동향" 페이지 방문 시 호출 — 매번 새 스냅샷을 쌓는 게 아니라, 키워드별로 최근 저장이
 * MIN_DAYS_BETWEEN_SNAPSHOTS일 이상 지났을 때만 새로 저장한다. 별도 cron 없이, 방문
 * 트래픽에 얹혀서 주 1회 정도 축적되도록 하는 방식.
 *
 * 이렇게 쌓인 시계열은 나중에 "네이버 관심 상승이 관세청 수입량보다 몇 주 앞서는지" 같은
 * 리드-래그 분석에 쓸 데이터가 된다 — 네이버 API 자체는 최근 몇 개월치만 주기 때문에,
 * 우리가 직접 쌓아야만 확보할 수 있는 데이터.
 */
export async function POST() {
  try {
    const items = await computeTrendDashboard();

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - MIN_DAYS_BETWEEN_SNAPSHOTS);

    let inserted = 0;
    let skipped = 0;

    for (const item of items) {
      const recent = await prisma.trendSnapshot.findFirst({
        where: { keyword: item.keyword, categoryCode: item.categoryCode },
        orderBy: { capturedAt: "desc" },
      });

      if (recent && recent.capturedAt > cutoff) {
        skipped++;
        continue;
      }

      await prisma.trendSnapshot.create({
        data: {
          keyword: item.keyword,
          categoryCode: item.categoryCode,
          categoryLabel: item.categoryLabel,
          recentAvg: item.recentAvg,
          growthPercent: item.growthPercent,
        },
      });
      inserted++;
    }

    return NextResponse.json({ inserted, skipped });
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const weekCount = await prisma.trendSnapshot.groupBy({
      by: ["capturedAt"],
    });

    const distinctDates = new Set(
      weekCount.map((w) => w.capturedAt.toISOString().slice(0, 10))
    );

    return NextResponse.json({ snapshotCount: weekCount.length, weeksCaptured: distinctDates.size });
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
