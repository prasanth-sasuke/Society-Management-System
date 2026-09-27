-- AlterTable
ALTER TABLE "users" ADD COLUMN     "flat_id" TEXT,
ADD COLUMN     "vendor_id" TEXT;

-- CreateIndex
CREATE INDEX "users_flat_id_idx" ON "users"("flat_id");

-- CreateIndex
CREATE INDEX "users_vendor_id_idx" ON "users"("vendor_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_flat_id_fkey" FOREIGN KEY ("flat_id") REFERENCES "flats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
