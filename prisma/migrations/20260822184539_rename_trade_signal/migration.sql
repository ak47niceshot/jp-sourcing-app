/*
  Warnings:

  - You are about to drop the column `koreaSignalJson` on the `SavedCandidate` table. All the data in the column will be lost.
  - Added the required column `hsCode` to the `SavedCandidate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tradeSignalJson` to the `SavedCandidate` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SavedCandidate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "keyword" TEXT NOT NULL,
    "hsCode" TEXT NOT NULL,
    "tradeSignalJson" TEXT NOT NULL,
    "japanCandidateJson" TEXT NOT NULL,
    "marginInputJson" TEXT NOT NULL,
    "marginResultJson" TEXT NOT NULL,
    "aiComment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_SavedCandidate" ("aiComment", "createdAt", "id", "japanCandidateJson", "keyword", "marginInputJson", "marginResultJson") SELECT "aiComment", "createdAt", "id", "japanCandidateJson", "keyword", "marginInputJson", "marginResultJson" FROM "SavedCandidate";
DROP TABLE "SavedCandidate";
ALTER TABLE "new_SavedCandidate" RENAME TO "SavedCandidate";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
