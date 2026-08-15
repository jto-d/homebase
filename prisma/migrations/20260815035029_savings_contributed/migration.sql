-- AlterTable
ALTER TABLE "BudgetNode" ADD COLUMN     "isSavings" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "BudgetNodeMonth" ADD COLUMN     "contributed" DECIMAL(10,2),
ALTER COLUMN "budget" DROP NOT NULL;

-- Backfill: promote the flag to the group, not the leaf that happened to carry
-- an annualLimit. isSavings is designed to live on the group and inherit down
-- (see BudgetNode.isSavings), so a sibling category added later without its own
-- limit still counts as savings. Handles both depths under a group: a direct
-- category, or a line item one level further down.
UPDATE "BudgetNode" AS grp
SET "isSavings" = true
FROM "BudgetNode" AS child
WHERE child."parentId" = grp.id
  AND child."annualLimit" IS NOT NULL;

UPDATE "BudgetNode" AS grp
SET "isSavings" = true
FROM "BudgetNode" AS child, "BudgetNode" AS leaf
WHERE leaf."parentId" = child.id
  AND child."parentId" = grp.id
  AND leaf."annualLimit" IS NOT NULL;
