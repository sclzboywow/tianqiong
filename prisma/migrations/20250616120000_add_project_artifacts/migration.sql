-- CreateTable
CREATE TABLE "ProjectArtifact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "seasonId" TEXT NOT NULL,
    "artifactSlug" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" TEXT,
    "producedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "expiresAt" DATETIME
);

-- CreateTable
CREATE TABLE "ProjectArtifactLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "seasonId" TEXT NOT NULL,
    "artifactSlug" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "ProjectArtifact_seasonId_idx" ON "ProjectArtifact"("seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectArtifact_seasonId_artifactSlug_key" ON "ProjectArtifact"("seasonId", "artifactSlug");

-- CreateIndex
CREATE INDEX "ProjectArtifactLog_seasonId_artifactSlug_idx" ON "ProjectArtifactLog"("seasonId", "artifactSlug");
