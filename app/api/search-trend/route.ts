import { NextRequest, NextResponse } from "next/server";
import { fetchSearchTrend } from "@/lib/naverSearchTrend";

export async function POST(req: NextRequest) {
  const { keyword } = await req.json();

  if (!keyword || typeof keyword !== "string") {
    return NextResponse.json({ error: "keyword가 필요합니다." }, { status: 400 });
  }

  try {
    const [group] = await fetchSearchTrend([
      { groupName: keyword, keywords: [keyword] },
    ]);
    return NextResponse.json(group ?? { title: keyword, keywords: [keyword], points: [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
