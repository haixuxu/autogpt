-- CreateTable
CREATE TABLE "AgentMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "handled" BOOLEAN NOT NULL DEFAULT false,
    "handledAt" DATETIME,
    "handledBy" TEXT,
    CONSTRAINT "AgentMessage_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AgentMessage_agentId_createdAt_idx" ON "AgentMessage"("agentId", "createdAt");

-- CreateIndex
CREATE INDEX "AgentMessage_agentId_handled_createdAt_idx" ON "AgentMessage"("agentId", "handled", "createdAt");
