import Link from "next/link";
import { prisma } from "@/lib/prisma";
import HomeSearchBox from "@/components/HomeSearchBox";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const recent = await prisma.savedCandidate.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="flex flex-col">
      <section className="min-h-[62vh] flex flex-col items-center justify-center text-center gap-6 px-4">
        <h1 className="text-5xl sm:text-6xl font-black tracking-tight">
          <span>Dily</span>
          <span className="text-blue-600 dark:text-blue-400">Japan</span>
        </h1>
        <p className="opacity-60 text-sm sm:text-base">
          일본→한국 상품 소싱 리서치 · 관세청 데이터, 라쿠텐, 도매가, AI 분석까지 한
          곳에서
        </p>

        <HomeSearchBox />

        <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
          <Link
            href="/research"
            className="rounded-full bg-blue-600 text-white px-5 py-2 font-medium hover:bg-blue-700 transition"
          >
            리서치 열기
          </Link>
          <Link
            href="/trends"
            className="rounded-full border border-black/15 dark:border-white/20 px-5 py-2 font-medium opacity-80 hover:opacity-100 hover:border-blue-500 transition"
          >
            AI추천 보기
          </Link>
          <Link
            href="/wholesale"
            className="rounded-full border border-black/15 dark:border-white/20 px-5 py-2 font-medium opacity-80 hover:opacity-100 hover:border-blue-500 transition"
          >
            도매 상품
          </Link>
          <Link
            href="/saved"
            className="rounded-full border border-black/15 dark:border-white/20 px-5 py-2 font-medium opacity-80 hover:opacity-100 hover:border-blue-500 transition"
          >
            저장한 후보
          </Link>
        </div>
      </section>

      {recent.length > 0 && (
        <section className="max-w-2xl mx-auto w-full px-4 pb-16">
          <h2 className="text-xs font-semibold opacity-50 uppercase tracking-wide mb-3">
            최근 저장한 후보
          </h2>
          <ul className="flex flex-col gap-2">
            {recent.map((item) => (
              <li
                key={item.id}
                className="border border-black/10 dark:border-white/10 rounded-lg px-4 py-3 text-sm hover:border-blue-500/50 transition"
              >
                <span className="font-semibold">{item.keyword}</span>
                <span className="opacity-50 ml-2 text-xs">
                  {new Date(item.createdAt).toLocaleString("ko-KR")}
                </span>
              </li>
            ))}
          </ul>
          <Link
            href="/saved"
            className="inline-block mt-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            전체 저장 목록 보기 →
          </Link>
        </section>
      )}
    </div>
  );
}
