import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-black/10 dark:border-white/10">
          <nav className="max-w-5xl mx-auto flex items-center gap-6 px-6 py-4">
            <a href="/" className="font-semibold">
              Dily<span className="text-blue-600 dark:text-blue-400">Japan</span>
            </a>
            <a href="/research" className="text-sm opacity-80 hover:opacity-100">
              리서치
            </a>
            <a href="/saved" className="text-sm opacity-80 hover:opacity-100">
              저장한 후보
            </a>
            <a href="/wholesale" className="text-sm opacity-80 hover:opacity-100">
              도매 상품
            </a>
          </nav>
        </header>
        <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
