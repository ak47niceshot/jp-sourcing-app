-- CreateTable
CREATE TABLE "SourcingAdvisorCache" (
    "id" INTEGER NOT NULL,
    "recommendationsJson" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourcingAdvisorCache_pkey" PRIMARY KEY ("id")
);
