-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';
