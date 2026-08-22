import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const recent = await prisma.savedCandidate.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-2xl font-semibold mb-2">일본 상품 소싱 리서치</h1>
        <p className="opacity-80 leading-relaxed">
          키워드를 입력하면 한국 시장(네이버 쇼핑 기준) 경쟁 상황과 일본
          소싱 후보(라쿠텐 기준)를 나란히 비교하고, 관세·배송비·수수료를
          반영한 마진율까지 계산할 수 있어요.
        </p>
        <Link
          href="/research"
          className="inline-block mt-4 px-4 py-2 rounded bg-foreground text-background text-sm font-medium"
        >
          리서치 시작하기
        </Link>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">최근 저장한 후보</h2>
        {recent.length === 0 ? (
          <p className="text-sm opacity-60">아직 저장한 후보가 없어요.</p>
        ) : (
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
        )}
        {recent.length > 0 && (
          <Link
            href="/saved"
            className="inline-block mt-3 text-sm underline opacity-80 hover:opacity-100"
          >
            전체 저장 목록 보기
          </Link>
        )}
      </section>
    </div>
  );
}
