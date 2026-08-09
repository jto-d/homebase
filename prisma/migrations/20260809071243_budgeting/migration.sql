-- CreateTable
CREATE TABLE "Budget" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "householdId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "merchant" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "householdId" TEXT NOT NULL,
    "ownerId" TEXT,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionSplit" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "TransactionSplit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Budget_householdId_idx" ON "Budget"("householdId");

-- CreateIndex
CREATE UNIQUE INDEX "Budget_ownerId_name_key" ON "Budget"("ownerId", "name");

-- CreateIndex
CREATE INDEX "Transaction_householdId_date_idx" ON "Transaction"("householdId", "date");

-- CreateIndex
CREATE INDEX "TransactionSplit_transactionId_idx" ON "TransactionSplit"("transactionId");

-- CreateIndex
CREATE INDEX "TransactionSplit_budgetId_idx" ON "TransactionSplit"("budgetId");

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionSplit" ADD CONSTRAINT "TransactionSplit_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionSplit" ADD CONSTRAINT "TransactionSplit_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
