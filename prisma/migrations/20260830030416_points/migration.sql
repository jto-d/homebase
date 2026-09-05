-- CreateEnum
CREATE TYPE "PointsProgramKind" AS ENUM ('TRANSFERABLE', 'HOTEL', 'AIRLINE');

-- CreateTable
CREATE TABLE "PointsProgram" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "PointsProgramKind" NOT NULL,
    "balance" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "householdId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "PointsProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointsRedemption" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ownerId" TEXT,

    CONSTRAINT "PointsRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PointsProgram_householdId_idx" ON "PointsProgram"("householdId");

-- CreateIndex
CREATE INDEX "PointsRedemption_programId_date_idx" ON "PointsRedemption"("programId", "date");

-- AddForeignKey
ALTER TABLE "PointsProgram" ADD CONSTRAINT "PointsProgram_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsProgram" ADD CONSTRAINT "PointsProgram_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsRedemption" ADD CONSTRAINT "PointsRedemption_programId_fkey" FOREIGN KEY ("programId") REFERENCES "PointsProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsRedemption" ADD CONSTRAINT "PointsRedemption_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
