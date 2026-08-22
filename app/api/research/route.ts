import { NextRequest, NextResponse } from "next/server";
import { fetchKoreaSignal } from "@/lib/naver";
import { fetchJapanCandidatesByKeyword } from "@/lib/rakuten";
import { fetchJpyToKrwRate } from "@/lib/fx";

export async function POST(req: NextRequest) {
  const { keyword } = await req.json();

  if (!keyword || typeof keyword !== "string") {
    return NextResponse.json({ error: "keyword가 필요합니다." }, { status: 400 });
  }

  try {
    const [koreaSignal, japanCandidates, fxRate] = await Promise.all([
      fetchKoreaSignal(keyword),
      fetchJapanCandidatesByKeyword(keyword),
      fetchJpyToKrwRate(),
    ]);

    return NextResponse.json({ koreaSignal, japanCandidates, fxRate });
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
