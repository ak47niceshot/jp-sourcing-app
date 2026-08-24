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

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm opacity-70">
          <Link href="/research" className="hover:opacity-100 hover:underline">
            리서치 열기
          </Link>
          <Link href="/wholesale" className="hover:opacity-100 hover:underline">
            도매 상품
          </Link>
          <Link href="/saved" className="hover:opacity-100 hover:underline">
            저장한 후보
          </Link>
        </div>
      </section>

      {recent.length > 0 && (
        <section className="max-w-2xl mx-auto w-full px-4 pb-16">
          <h2 className="text-xs font-medium opacity-50 uppercase tracking-wide mb-3">
            최근 저장한 후보
          </h2>
          <ul className="flex flex-col gap-2">
            {recent.map((item) => (
              <li
                key={item.id}
                className="border border-black/10 dark:border-white/10 rounded px-4 py-3 text-sm"
              >
                <span className="font-medium">{item.keyword}</span>
                <span className="opacity-60 ml-2">
                  {new Date(item.createdAt).toLocaleString("ko-KR")}
                </span>
              </li>
            ))}
          </ul>
          <Link
            href="/saved"
            className="inline-block mt-3 text-sm underline opacity-80 hover:opacity-100"
          >
            전체 저장 목록 보기
          </Link>
        </section>
      )}
    </div>
  );
}
