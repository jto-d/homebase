-- Rename, not drop+add: preserves the existing true/false values instead of
-- resetting every row to the column's default (see BudgetNode.isManual).
ALTER TABLE "BudgetNode" RENAME COLUMN "isSavings" TO "isManual";
