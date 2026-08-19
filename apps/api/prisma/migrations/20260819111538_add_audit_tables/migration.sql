-- CreateTable
CREATE TABLE "SlipSnapshot" (
    "id" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "bookingCode" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "betType" TEXT NOT NULL,
    "selectionCount" INTEGER NOT NULL,
    "slip" JSONB NOT NULL,
    "captureType" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SlipSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversionRun" (
    "id" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "sourceCode" TEXT NOT NULL,
    "targetCode" TEXT,
    "sourceFingerprint" TEXT NOT NULL,
    "targetFingerprint" TEXT,
    "verified" BOOLEAN NOT NULL,
    "sourceSelectionCount" INTEGER NOT NULL,
    "targetSelectionCount" INTEGER,
    "missingIdentities" JSONB,
    "extraIdentities" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversionRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SlipSnapshot_bookingCode_idx" ON "SlipSnapshot"("bookingCode");

-- CreateIndex
CREATE INDEX "SlipSnapshot_fingerprint_idx" ON "SlipSnapshot"("fingerprint");

-- CreateIndex
CREATE INDEX "SlipSnapshot_capturedAt_idx" ON "SlipSnapshot"("capturedAt");

-- CreateIndex
CREATE INDEX "ConversionRun_sourceCode_idx" ON "ConversionRun"("sourceCode");

-- CreateIndex
CREATE INDEX "ConversionRun_targetCode_idx" ON "ConversionRun"("targetCode");

-- CreateIndex
CREATE INDEX "ConversionRun_verified_idx" ON "ConversionRun"("verified");

-- CreateIndex
CREATE INDEX "ConversionRun_createdAt_idx" ON "ConversionRun"("createdAt");
