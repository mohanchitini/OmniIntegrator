-- Add members column to TrelloCard if it doesn't exist
ALTER TABLE "TrelloCard" ADD COLUMN IF NOT EXISTS "members" TEXT;
