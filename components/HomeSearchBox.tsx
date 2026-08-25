"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HomeSearchBox() {
  const [keyword, setKeyword] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set("keyword", keyword.trim());
    router.push(`/research${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl">
      <div className="flex items-center gap-2 border border-black/15 dark:border-white/20 rounded-full px-5 py-3 shadow-sm hover:shadow-md focus-within:shadow-md focus-within:border-blue-500 transition-all">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          className="opacity-40 shrink-0"
        >
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="상품 키워드로 리서치 시작 (예: 화장품, 문구, 선풍기...)"
          className="flex-1 bg-transparent outline-none text-sm"
          autoFocus
        />
      </div>
    </form>
  );
}
