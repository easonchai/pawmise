/*
  Warnings:

  - Added the required column `breed` to the `Pet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `savingsGoal` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Breed" AS ENUM ('POM', 'MONGREL', 'KORAT', 'CHIHUAHUA', 'CORGI', 'SHIHTZU', 'GOLDIE');

-- AlterTable
ALTER TABLE "Pet" ADD COLUMN     "breed" "Breed" NOT NULL,
ADD COLUMN     "privateKey" TEXT,
ALTER COLUMN "walletAddress" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "savingsGoal" BIGINT NOT NULL;
