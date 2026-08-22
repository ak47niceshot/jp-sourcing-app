-- CreateTable
CREATE TABLE "SavedCandidate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "keyword" TEXT NOT NULL,
    "koreaSignalJson" TEXT NOT NULL,
    "japanCandidateJson" TEXT NOT NULL,
    "marginInputJson" TEXT NOT NULL,
    "marginResultJson" TEXT NOT NULL,
    "aiComment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
