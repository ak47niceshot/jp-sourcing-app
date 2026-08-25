import type { Metadata } from "next";
import localFont from "next/font/local";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const pretendard = localFont({
  src: "../node_modules/pretendard/dist/public/variable/PretendardVariable.ttf",
  variable: "--font-pretendard",
  weight: "45 920",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DilyJapan",
  description: "일본→한국 상품 소싱 경쟁력 리서치 도구",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${pretendard.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-10 border-b border-black/10 dark:border-white/10 bg-background/80 backdrop-blur">
          <nav className="max-w-5xl mx-auto flex items-center gap-7 px-6 py-4">
            <a href="/" className="text-lg font-black tracking-tight shrink-0">
              Dily<span className="text-blue-600 dark:text-blue-400">Japan</span>
            </a>
            <div className="flex items-center gap-5">
              <a
                href="/research"
                className="text-sm font-medium opacity-70 hover:opacity-100 hover:text-blue-600 dark:hover:text-blue-400 transition"
              >
                리서치
              </a>
              <a
                href="/trends"
                className="text-sm font-medium opacity-70 hover:opacity-100 hover:text-blue-600 dark:hover:text-blue-400 transition"
              >
                AI추천
              </a>
              <a
                href="/saved"
                className="text-sm font-medium opacity-70 hover:opacity-100 hover:text-blue-600 dark:hover:text-blue-400 transition"
              >
                저장한 후보
              </a>
              <a
                href="/wholesale"
                className="text-sm font-medium opacity-70 hover:opacity-100 hover:text-blue-600 dark:hover:text-blue-400 transition"
              >
                도매 상품
              </a>
            </div>
          </nav>
        </header>
        <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
