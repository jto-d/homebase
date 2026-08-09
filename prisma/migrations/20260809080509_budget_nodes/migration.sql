/*
  Warnings:

  - You are about to drop the `Budget` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Budget" DROP CONSTRAINT "Budget_householdId_fkey";

-- DropForeignKey
ALTER TABLE "Budget" DROP CONSTRAINT "Budget_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "TransactionSplit" DROP CONSTRAINT "TransactionSplit_budgetId_fkey";

-- AlterTable
ALTER TABLE "Household" ADD COLUMN     "budgetStartMonth" INTEGER,
ADD COLUMN     "budgetStartYear" INTEGER;

-- DropTable
DROP TABLE "Budget";

-- CreateTable
CREATE TABLE "BudgetNode" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "budget" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "annualLimit" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "householdId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "parentId" TEXT,

    CONSTRAINT "BudgetNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetNodeMonth" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "budget" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "BudgetNodeMonth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncomeSource" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sub" TEXT,
    "amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "position" INTEGER NOT NULL,
    "householdId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "IncomeSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BudgetNode_householdId_ownerId_position_idx" ON "BudgetNode"("householdId", "ownerId", "position");

-- CreateIndex
CREATE INDEX "BudgetNode_parentId_idx" ON "BudgetNode"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetNodeMonth_nodeId_year_month_key" ON "BudgetNodeMonth"("nodeId", "year", "month");

-- CreateIndex
CREATE INDEX "IncomeSource_householdId_ownerId_position_idx" ON "IncomeSource"("householdId", "ownerId", "position");

-- AddForeignKey
ALTER TABLE "BudgetNode" ADD CONSTRAINT "BudgetNode_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetNode" ADD CONSTRAINT "BudgetNode_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetNode" ADD CONSTRAINT "BudgetNode_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "BudgetNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetNodeMonth" ADD CONSTRAINT "BudgetNodeMonth_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "BudgetNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomeSource" ADD CONSTRAINT "IncomeSource_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomeSource" ADD CONSTRAINT "IncomeSource_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionSplit" ADD CONSTRAINT "TransactionSplit_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "BudgetNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
