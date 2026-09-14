-- CreateEnum
CREATE TYPE "BillingFrequency" AS ENUM ('QUARTERLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "FlatType" AS ENUM ('BHK1', 'BHK2', 'BHK3', 'BHK4');

-- CreateEnum
CREATE TYPE "OccupancyStatus" AS ENUM ('OWNER_OCCUPIED', 'TENANT', 'VACANT');

-- CreateEnum
CREATE TYPE "ResidentType" AS ENUM ('OWNER', 'TENANT');

-- CreateEnum
CREATE TYPE "MoveEventType" AS ENUM ('MOVE_IN', 'MOVE_OUT', 'LEASE_RENEWAL');

-- CreateEnum
CREATE TYPE "BillStatus" AS ENUM ('PAID', 'PENDING', 'OVERDUE', 'PART_PAID');

-- CreateEnum
CREATE TYPE "VoucherStatus" AS ENUM ('DRAFT', 'EC_APPROVAL', 'APPROVED');

-- CreateEnum
CREATE TYPE "TicketCategory" AS ENUM ('PLUMBING', 'ELECTRICAL', 'LIFT', 'HOUSEKEEPING', 'SECURITY', 'CARPENTRY', 'FACILITY');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'AWAITING_VENDOR', 'RESOLVED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PROCESSED', 'PENDING', 'HOLD');

-- CreateEnum
CREATE TYPE "PaymentState" AS ENUM ('CLEAR', 'DUE');

-- CreateEnum
CREATE TYPE "AssetCondition" AS ENUM ('GOOD', 'MONITOR', 'UNDER_REPAIR', 'OUT_OF_SERVICE', 'REFILL_DUE');

-- CreateEnum
CREATE TYPE "FacilityStatus" AS ENUM ('AVAILABLE', 'BOOKED', 'PARTLY_BOOKED', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "BookingPaymentStatus" AS ENUM ('PAID', 'PENDING', 'AWAITING_APPROVAL', 'NA');

-- CreateEnum
CREATE TYPE "ShiftState" AS ENUM ('COMPLETED', 'ON_DUTY', 'NEXT');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'LATE', 'ON_DUTY', 'ABSENT', 'ROSTERED');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('CLOSED', 'UNDER_REVIEW', 'CLOSED_WARNING');

-- CreateEnum
CREATE TYPE "FollowUpStatus" AS ENUM ('VERIFIED', 'IN_PROGRESS', 'ESCALATED', 'SCHEDULED');

-- CreateEnum
CREATE TYPE "AmcStatus" AS ENUM ('ACTIVE', 'RENEWAL_DUE', 'DUE_THIS_WEEK', 'SCHEDULED_TODAY');

-- CreateTable
CREATE TABLE "societies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "penalty_per_day" INTEGER NOT NULL,
    "billing_frequency" "BillingFrequency" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "societies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocks" (
    "id" TEXT NOT NULL,
    "society_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "units_per_floor" INTEGER NOT NULL,
    "floor_count" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flats" (
    "id" TEXT NOT NULL,
    "block_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "floor" INTEGER NOT NULL,
    "unit_label" TEXT NOT NULL,
    "type" "FlatType" NOT NULL,
    "carpet_sqft" INTEGER,
    "uds_sqft" INTEGER,
    "parking_slots" INTEGER NOT NULL DEFAULT 0,
    "status" "OccupancyStatus" NOT NULL,
    "dues_pending" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "residents" (
    "id" TEXT NOT NULL,
    "flat_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "type" "ResidentType" NOT NULL,
    "family_members" INTEGER NOT NULL,
    "phone" TEXT NOT NULL,
    "emergency_contact" TEXT,
    "resident_since" DATE NOT NULL,
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "residents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "move_events" (
    "id" TEXT NOT NULL,
    "flat_id" TEXT NOT NULL,
    "resident_id" TEXT,
    "type" "MoveEventType" NOT NULL,
    "happened_on" DATE NOT NULL,
    "notes" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "move_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bills" (
    "id" TEXT NOT NULL,
    "flat_id" TEXT NOT NULL,
    "resident_id" TEXT,
    "period_label" TEXT NOT NULL,
    "billed_on" DATE NOT NULL,
    "due_on" DATE NOT NULL,
    "maintenance_amount" DECIMAL(12,2) NOT NULL,
    "special_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "previous_due" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "penalty_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paid_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "status" "BillStatus" NOT NULL,
    "overdue_days" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vouchers" (
    "id" TEXT NOT NULL,
    "society_id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "account_head" TEXT NOT NULL,
    "party_name" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "VoucherStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" TEXT NOT NULL,
    "society_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "meta" TEXT NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_lines" (
    "id" TEXT NOT NULL,
    "society_id" TEXT NOT NULL,
    "head" TEXT NOT NULL,
    "spent_amount" DECIMAL(12,2) NOT NULL,
    "budget_amount" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "society_id" TEXT NOT NULL,
    "ticket_no" TEXT NOT NULL,
    "flat_id" TEXT,
    "location" TEXT NOT NULL,
    "category" "TicketCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "TicketPriority" NOT NULL,
    "assignee" TEXT NOT NULL,
    "photos_note" TEXT,
    "status" "TicketStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_events" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "note" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_feedback" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT,
    "resident_label" TEXT NOT NULL,
    "stars" INTEGER NOT NULL,
    "note" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_members" (
    "id" TEXT NOT NULL,
    "society_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "present_days" INTEGER NOT NULL,
    "working_days" INTEGER NOT NULL,
    "salary" DECIMAL(12,2) NOT NULL,
    "payout_status" "PayoutStatus" NOT NULL,
    "payout_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roster_duties" (
    "id" TEXT NOT NULL,
    "society_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "week_start" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roster_duties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roster_assignments" (
    "id" TEXT NOT NULL,
    "duty_id" TEXT NOT NULL,
    "day_index" INTEGER NOT NULL,
    "day_label" TEXT NOT NULL,
    "person_name" TEXT NOT NULL,
    "is_off" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "roster_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follow_ups" (
    "id" TEXT NOT NULL,
    "society_id" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "owner_name" TEXT NOT NULL,
    "due_on" DATE NOT NULL,
    "verifier" TEXT NOT NULL,
    "status" "FollowUpStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "follow_ups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL,
    "society_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "contract_value" TEXT NOT NULL,
    "renewal_on" DATE,
    "renewal_label" TEXT,
    "payment_state" "PaymentState" NOT NULL,
    "payment_note" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotations" (
    "id" TEXT NOT NULL,
    "society_id" TEXT NOT NULL,
    "work" TEXT NOT NULL,
    "vendors_note" TEXT NOT NULL,
    "range_note" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_invoices" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT,
    "invoice_no" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "due_note" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "society_id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "installed_year" INTEGER,
    "amc_note" TEXT NOT NULL,
    "condition" "AssetCondition" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amc_contracts" (
    "id" TEXT NOT NULL,
    "society_id" TEXT NOT NULL,
    "vendor_id" TEXT,
    "equipment" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "next_on" DATE NOT NULL,
    "status" "AmcStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "amc_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_reminders" (
    "id" TEXT NOT NULL,
    "society_id" TEXT NOT NULL,
    "what" TEXT NOT NULL,
    "when_label" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "breakdown_events" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT,
    "what" TEXT NOT NULL,
    "happened_on" DATE NOT NULL,
    "note" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "breakdown_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facilities" (
    "id" TEXT NOT NULL,
    "society_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity_note" TEXT NOT NULL,
    "charge_note" TEXT NOT NULL,
    "next_note" TEXT NOT NULL,
    "status" "FacilityStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "facility_id" TEXT NOT NULL,
    "flat_id" TEXT,
    "booking_date" DATE NOT NULL,
    "date_label" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "charge" TEXT NOT NULL,
    "deposit" TEXT NOT NULL,
    "payment_status" "BookingPaymentStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_shifts" (
    "id" TEXT NOT NULL,
    "society_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hours" TEXT NOT NULL,
    "staff_note" TEXT NOT NULL,
    "state" "ShiftState" NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guard_attendances" (
    "id" TEXT NOT NULL,
    "society_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "post" TEXT NOT NULL,
    "shift" TEXT NOT NULL,
    "times" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "status_note" TEXT,
    "attended_on" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guard_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "handover_notes" (
    "id" TEXT NOT NULL,
    "society_id" TEXT NOT NULL,
    "when_label" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "handover_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patrol_checks" (
    "id" TEXT NOT NULL,
    "society_id" TEXT NOT NULL,
    "point" TEXT NOT NULL,
    "mark" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patrol_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL,
    "society_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "happened_at" TIMESTAMP(3) NOT NULL,
    "status" "IncidentStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "blocks_society_id_idx" ON "blocks"("society_id");

-- CreateIndex
CREATE UNIQUE INDEX "blocks_society_id_code_key" ON "blocks"("society_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "flats_code_key" ON "flats"("code");

-- CreateIndex
CREATE INDEX "flats_block_id_idx" ON "flats"("block_id");

-- CreateIndex
CREATE INDEX "flats_status_idx" ON "flats"("status");

-- CreateIndex
CREATE INDEX "residents_flat_id_idx" ON "residents"("flat_id");

-- CreateIndex
CREATE INDEX "residents_full_name_idx" ON "residents"("full_name");

-- CreateIndex
CREATE INDEX "move_events_flat_id_idx" ON "move_events"("flat_id");

-- CreateIndex
CREATE INDEX "move_events_happened_on_idx" ON "move_events"("happened_on");

-- CreateIndex
CREATE INDEX "bills_flat_id_idx" ON "bills"("flat_id");

-- CreateIndex
CREATE INDEX "bills_status_idx" ON "bills"("status");

-- CreateIndex
CREATE INDEX "bills_period_label_idx" ON "bills"("period_label");

-- CreateIndex
CREATE UNIQUE INDEX "vouchers_number_key" ON "vouchers"("number");

-- CreateIndex
CREATE INDEX "vouchers_society_id_idx" ON "vouchers"("society_id");

-- CreateIndex
CREATE INDEX "bank_accounts_society_id_idx" ON "bank_accounts"("society_id");

-- CreateIndex
CREATE INDEX "budget_lines_society_id_idx" ON "budget_lines"("society_id");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_ticket_no_key" ON "tickets"("ticket_no");

-- CreateIndex
CREATE INDEX "tickets_society_id_idx" ON "tickets"("society_id");

-- CreateIndex
CREATE INDEX "tickets_flat_id_idx" ON "tickets"("flat_id");

-- CreateIndex
CREATE INDEX "tickets_status_priority_idx" ON "tickets"("status", "priority");

-- CreateIndex
CREATE INDEX "ticket_events_ticket_id_idx" ON "ticket_events"("ticket_id");

-- CreateIndex
CREATE INDEX "ticket_feedback_ticket_id_idx" ON "ticket_feedback"("ticket_id");

-- CreateIndex
CREATE INDEX "staff_members_society_id_idx" ON "staff_members"("society_id");

-- CreateIndex
CREATE INDEX "roster_duties_society_id_week_start_idx" ON "roster_duties"("society_id", "week_start");

-- CreateIndex
CREATE INDEX "roster_assignments_duty_id_idx" ON "roster_assignments"("duty_id");

-- CreateIndex
CREATE UNIQUE INDEX "roster_assignments_duty_id_day_index_key" ON "roster_assignments"("duty_id", "day_index");

-- CreateIndex
CREATE INDEX "follow_ups_society_id_idx" ON "follow_ups"("society_id");

-- CreateIndex
CREATE INDEX "follow_ups_status_idx" ON "follow_ups"("status");

-- CreateIndex
CREATE INDEX "vendors_society_id_idx" ON "vendors"("society_id");

-- CreateIndex
CREATE INDEX "quotations_society_id_idx" ON "quotations"("society_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_invoices_invoice_no_key" ON "vendor_invoices"("invoice_no");

-- CreateIndex
CREATE INDEX "vendor_invoices_vendor_id_idx" ON "vendor_invoices"("vendor_id");

-- CreateIndex
CREATE UNIQUE INDEX "assets_tag_key" ON "assets"("tag");

-- CreateIndex
CREATE INDEX "assets_society_id_idx" ON "assets"("society_id");

-- CreateIndex
CREATE INDEX "assets_category_idx" ON "assets"("category");

-- CreateIndex
CREATE INDEX "amc_contracts_society_id_idx" ON "amc_contracts"("society_id");

-- CreateIndex
CREATE INDEX "amc_contracts_vendor_id_idx" ON "amc_contracts"("vendor_id");

-- CreateIndex
CREATE INDEX "maintenance_reminders_society_id_idx" ON "maintenance_reminders"("society_id");

-- CreateIndex
CREATE INDEX "breakdown_events_asset_id_idx" ON "breakdown_events"("asset_id");

-- CreateIndex
CREATE INDEX "facilities_society_id_idx" ON "facilities"("society_id");

-- CreateIndex
CREATE UNIQUE INDEX "facilities_society_id_name_key" ON "facilities"("society_id", "name");

-- CreateIndex
CREATE INDEX "bookings_facility_id_idx" ON "bookings"("facility_id");

-- CreateIndex
CREATE INDEX "bookings_flat_id_idx" ON "bookings"("flat_id");

-- CreateIndex
CREATE INDEX "bookings_booking_date_idx" ON "bookings"("booking_date");

-- CreateIndex
CREATE INDEX "security_shifts_society_id_idx" ON "security_shifts"("society_id");

-- CreateIndex
CREATE INDEX "guard_attendances_society_id_attended_on_idx" ON "guard_attendances"("society_id", "attended_on");

-- CreateIndex
CREATE INDEX "handover_notes_society_id_idx" ON "handover_notes"("society_id");

-- CreateIndex
CREATE INDEX "patrol_checks_society_id_idx" ON "patrol_checks"("society_id");

-- CreateIndex
CREATE INDEX "incidents_society_id_idx" ON "incidents"("society_id");

-- CreateIndex
CREATE INDEX "incidents_status_idx" ON "incidents"("status");

-- AddForeignKey
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flats" ADD CONSTRAINT "flats_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "blocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "residents" ADD CONSTRAINT "residents_flat_id_fkey" FOREIGN KEY ("flat_id") REFERENCES "flats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "move_events" ADD CONSTRAINT "move_events_flat_id_fkey" FOREIGN KEY ("flat_id") REFERENCES "flats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "move_events" ADD CONSTRAINT "move_events_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "residents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_flat_id_fkey" FOREIGN KEY ("flat_id") REFERENCES "flats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "residents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_lines" ADD CONSTRAINT "budget_lines_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_flat_id_fkey" FOREIGN KEY ("flat_id") REFERENCES "flats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_events" ADD CONSTRAINT "ticket_events_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_feedback" ADD CONSTRAINT "ticket_feedback_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_members" ADD CONSTRAINT "staff_members_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roster_duties" ADD CONSTRAINT "roster_duties_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roster_assignments" ADD CONSTRAINT "roster_assignments_duty_id_fkey" FOREIGN KEY ("duty_id") REFERENCES "roster_duties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_invoices" ADD CONSTRAINT "vendor_invoices_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amc_contracts" ADD CONSTRAINT "amc_contracts_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amc_contracts" ADD CONSTRAINT "amc_contracts_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_reminders" ADD CONSTRAINT "maintenance_reminders_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "breakdown_events" ADD CONSTRAINT "breakdown_events_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facilities" ADD CONSTRAINT "facilities_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_flat_id_fkey" FOREIGN KEY ("flat_id") REFERENCES "flats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_shifts" ADD CONSTRAINT "security_shifts_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guard_attendances" ADD CONSTRAINT "guard_attendances_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handover_notes" ADD CONSTRAINT "handover_notes_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patrol_checks" ADD CONSTRAINT "patrol_checks_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
