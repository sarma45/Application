-- AlterTable
ALTER TABLE "User" ADD COLUMN "passwordChangedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Payment_userId_idx" ON "Payment"("userId");
CREATE INDEX IF NOT EXISTS "Payment_status_idx" ON "Payment"("status");
CREATE INDEX IF NOT EXISTS "CreatorPayout_creatorId_status_idx" ON "CreatorPayout"("creatorId", "status");
CREATE INDEX IF NOT EXISTS "AgentVersion_agentId_idx" ON "AgentVersion"("agentId");
