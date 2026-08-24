-- CreateTable
CREATE TABLE "SavedCandidate" (
    "id" SERIAL NOT NULL,
    "keyword" TEXT NOT NULL,
    "hsCode" TEXT NOT NULL,
    "tradeSignalJson" TEXT NOT NULL,
    "japanCandidateJson" TEXT NOT NULL,
    "marginInputJson" TEXT NOT NULL,
    "marginResultJson" TEXT NOT NULL,
    "aiComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WholesaleItem" (
    "id" SERIAL NOT NULL,
    "source" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "code" TEXT,
    "wholesalePriceJpy" DOUBLE PRECISION NOT NULL,
    "referencePriceJpy" DOUBLE PRECISION,
    "rawJson" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WholesaleItem_pkey" PRIMARY KEY ("id")
);
