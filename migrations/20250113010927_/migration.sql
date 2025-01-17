-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "availableSlots" INTEGER NOT NULL DEFAULT 0;
UPDATE "Room" SET "availableSlots" = "capacity";
ALTER TABLE "Room" ALTER COLUMN "availableSlots" DROP DEFAULT;