import { NextRequest, NextResponse } from "next/server";
import { analyzeCandidate, AnalyzeInput } from "@/lib/analyze";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as AnalyzeInput;

  if (!body?.keyword || !body?.tradeSignal || !body?.japanItem || !body?.marginInputs || !body?.marginResult) {
    return NextResponse.json({ error: "필수 데이터가 누락되었습니다." }, { status: 400 });
  }

  try {
    const comment = await analyzeCandidate(body);
    return NextResponse.json({ comment });
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
