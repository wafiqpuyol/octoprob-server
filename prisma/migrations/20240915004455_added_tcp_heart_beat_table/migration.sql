-- CreateTable
CREATE TABLE "MongoDBHeartbeat" (
    "id" SERIAL NOT NULL,
    "monitorId" INTEGER NOT NULL,
    "status" INTEGER NOT NULL,
    "code" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT,
    "timestamp" BIGINT NOT NULL,
    "responseTime" INTEGER NOT NULL DEFAULT 0,
    "connection" TEXT,

    CONSTRAINT "MongoDBHeartbeat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RedisHeartbeat" (
    "id" SERIAL NOT NULL,
    "monitorId" INTEGER NOT NULL,
    "status" INTEGER NOT NULL,
    "code" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT,
    "timestamp" BIGINT NOT NULL,
    "responseTime" INTEGER NOT NULL DEFAULT 0,
    "connection" TEXT,

    CONSTRAINT "RedisHeartbeat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TCPHeartbeat" (
    "id" SERIAL NOT NULL,
    "monitorId" INTEGER NOT NULL,
    "status" INTEGER NOT NULL,
    "code" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT,
    "timestamp" BIGINT NOT NULL,
    "responseTime" INTEGER NOT NULL DEFAULT 0,
    "connection" TEXT,

    CONSTRAINT "TCPHeartbeat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MongoDBHeartbeat_monitorId_idx" ON "MongoDBHeartbeat"("monitorId");

-- CreateIndex
CREATE INDEX "RedisHeartbeat_monitorId_idx" ON "RedisHeartbeat"("monitorId");

-- CreateIndex
CREATE INDEX "TCPHeartbeat_monitorId_idx" ON "TCPHeartbeat"("monitorId");
