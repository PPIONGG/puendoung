-- AlterTable
ALTER TABLE "Order" ADD COLUMN "lookupToken" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Order_lookupToken_key" ON "Order"("lookupToken");
