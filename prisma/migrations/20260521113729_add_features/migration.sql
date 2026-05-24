/*
  Warnings:

  - Made the column `leaderboardVisible` on table `AppSettings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `points` on table `PhotoPuzzle` required. This step will fail if there are existing NULL values in that column.
  - Made the column `active` on table `PhotoPuzzle` required. This step will fail if there are existing NULL values in that column.
  - Made the column `points` on table `TriviaQuestion` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "TriviaQuestion" DROP CONSTRAINT "TriviaQuestion_categoryId_fkey";

-- AlterTable
ALTER TABLE "AppSettings" ALTER COLUMN "leaderboardVisible" SET NOT NULL;

-- AlterTable
ALTER TABLE "PhotoPuzzle" ALTER COLUMN "points" SET NOT NULL,
ALTER COLUMN "active" SET NOT NULL;

-- AlterTable
ALTER TABLE "TriviaQuestion" ALTER COLUMN "points" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "TriviaQuestion" ADD CONSTRAINT "TriviaQuestion_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TriviaCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
