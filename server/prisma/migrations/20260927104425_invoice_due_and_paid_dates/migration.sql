-- AlterTable
ALTER TABLE "vendor_invoices" ADD COLUMN     "due_on" DATE,
ADD COLUMN     "paid_on" DATE;

-- CreateIndex
CREATE INDEX "vendor_invoices_paid_on_idx" ON "vendor_invoices"("paid_on");
