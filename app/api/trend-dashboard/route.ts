import { NextResponse } from "next/server";
import { computeTrendDashboard } from "@/lib/trendDashboard";

export type { TrendDashboardItem } from "@/lib/trendDashboard";

export async function GET() {
  try {
    const items = await computeTrendDashboard();
    return NextResponse.json({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
