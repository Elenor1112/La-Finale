-- Add hub-based QR destinations and ordered trivia questions.

ALTER TABLE "TriviaQuestion"
ADD COLUMN IF NOT EXISTS "order" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "GameHub" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "enabledGames" TEXT NOT NULL DEFAULT '["trivia","puzzle"]',
  "triviaEnabled" BOOLEAN NOT NULL DEFAULT true,
  "puzzleEnabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "GameHub_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "GameHub_code_key" ON "GameHub"("code");

ALTER TABLE "GameHub"
ADD COLUMN IF NOT EXISTS "enabledGames" TEXT NOT NULL DEFAULT '["trivia","puzzle"]';
