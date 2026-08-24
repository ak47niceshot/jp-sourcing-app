import { NextResponse } from "next/server";
import { fetchJpyToKrwRate } from "@/lib/fx";

export async function GET() {
  const fxRate = await fetchJpyToKrwRate();
  return NextResponse.json({ fxRate });
}
