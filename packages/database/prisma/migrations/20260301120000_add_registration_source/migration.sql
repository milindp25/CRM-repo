-- AlterTable
ALTER TABLE "companies" ADD COLUMN "registration_source" VARCHAR(50) NOT NULL DEFAULT 'SELF_REGISTERED';
