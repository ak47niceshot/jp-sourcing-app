-- CreateTable
CREATE TABLE "WholesaleItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "source" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "code" TEXT,
    "wholesalePriceJpy" REAL NOT NULL,
    "referencePriceJpy" REAL,
    "rawJson" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
