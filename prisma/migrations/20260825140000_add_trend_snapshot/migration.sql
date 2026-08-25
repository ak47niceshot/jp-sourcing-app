-- CreateTable
CREATE TABLE "TrendSnapshot" (
    "id" SERIAL NOT NULL,
    "keyword" TEXT NOT NULL,
    "categoryCode" TEXT NOT NULL,
    "categoryLabel" TEXT NOT NULL,
    "recentAvg" DOUBLE PRECISION NOT NULL,
    "growthPercent" DOUBLE PRECISION NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrendSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrendSnapshot_keyword_categoryCode_capturedAt_idx" ON "TrendSnapshot"("keyword", "categoryCode", "capturedAt");
