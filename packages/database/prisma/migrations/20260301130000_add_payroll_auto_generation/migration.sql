-- AlterTable
ALTER TABLE "companies" ADD COLUMN "payroll_auto_generate" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "companies" ADD COLUMN "payroll_auto_day" INTEGER NOT NULL DEFAULT 25;
