-- CreateTable
CREATE TABLE "PlayerDevice" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "addedBySeat" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceLink" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "createdBySeat" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NudgeSubscription" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NudgeSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlayerDevice_tokenHash_key" ON "PlayerDevice"("tokenHash");

-- CreateIndex
CREATE INDEX "PlayerDevice_playerId_idx" ON "PlayerDevice"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceLink_codeHash_key" ON "DeviceLink"("codeHash");

-- CreateIndex
CREATE INDEX "DeviceLink_playerId_idx" ON "DeviceLink"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "NudgeSubscription_endpoint_key" ON "NudgeSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "NudgeSubscription_playerId_idx" ON "NudgeSubscription"("playerId");

-- AddForeignKey
ALTER TABLE "PlayerDevice" ADD CONSTRAINT "PlayerDevice_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceLink" ADD CONSTRAINT "DeviceLink_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NudgeSubscription" ADD CONSTRAINT "NudgeSubscription_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
