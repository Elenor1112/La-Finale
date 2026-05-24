-- Migration: add AppSettings, TriviaCategory, TriviaQuestion, PhotoPuzzle

BEGIN;

-- AppSettings
CREATE TABLE IF NOT EXISTS "AppSettings" (
  "id" INTEGER PRIMARY KEY DEFAULT 1,
  "leaderboardVisible" BOOLEAN DEFAULT TRUE
);

-- TriviaCategory
CREATE SEQUENCE IF NOT EXISTS "TriviaCategory_id_seq";
CREATE TABLE IF NOT EXISTS "TriviaCategory" (
  "id" INTEGER PRIMARY KEY DEFAULT nextval('"TriviaCategory_id_seq"'),
  "name" TEXT UNIQUE NOT NULL
);

-- TriviaQuestion
CREATE SEQUENCE IF NOT EXISTS "TriviaQuestion_id_seq";
CREATE TABLE IF NOT EXISTS "TriviaQuestion" (
  "id" INTEGER PRIMARY KEY DEFAULT nextval('"TriviaQuestion_id_seq"'),
  "categoryId" INTEGER NOT NULL REFERENCES "TriviaCategory"("id") ON DELETE CASCADE,
  "question" TEXT NOT NULL,
  "optionA" TEXT NOT NULL,
  "optionB" TEXT NOT NULL,
  "optionC" TEXT NOT NULL,
  "optionD" TEXT NOT NULL,
  "correct" TEXT NOT NULL,
  "points" INTEGER DEFAULT 10
);

-- PhotoPuzzle
CREATE SEQUENCE IF NOT EXISTS "PhotoPuzzle_id_seq";
CREATE TABLE IF NOT EXISTS "PhotoPuzzle" (
  "id" INTEGER PRIMARY KEY DEFAULT nextval('"PhotoPuzzle_id_seq"'),
  "title" TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "points" INTEGER DEFAULT 15,
  "active" BOOLEAN DEFAULT TRUE
);

COMMIT;
