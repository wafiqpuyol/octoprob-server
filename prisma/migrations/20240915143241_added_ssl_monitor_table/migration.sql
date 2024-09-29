-- CreateTable
CREATE TABLE "SSLMonitor" (
    "id" SERIAL NOT NULL,
    "notificationId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "status" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "frequency" INTEGER NOT NULL DEFAULT 30,
    "alertThreshold" INTEGER NOT NULL DEFAULT 1,
    "url" TEXT,
    "info" TEXT,

    CONSTRAINT "SSLMonitor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SSLMonitor_userId_idx" ON "SSLMonitor"("userId");
