-- CreateTable
CREATE TABLE "Step" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "stepIndex" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "output" TEXT,
    "status" TEXT NOT NULL DEFAULT 'created',
    "isLast" BOOLEAN NOT NULL DEFAULT false,
    "additionalInput" TEXT,
    "additionalOutput" TEXT,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Step_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Artifact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stepId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "relativePath" TEXT,
    "uri" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Artifact_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "Step" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Step_agentId_status_idx" ON "Step"("agentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Step_agentId_stepIndex_key" ON "Step"("agentId", "stepIndex");

-- CreateIndex
CREATE INDEX "Artifact_stepId_idx" ON "Artifact"("stepId");
