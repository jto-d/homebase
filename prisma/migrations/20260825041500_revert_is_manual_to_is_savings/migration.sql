-- Revert: rename back, preserving data.
ALTER TABLE "BudgetNode" RENAME COLUMN "isManual" TO "isSavings";
