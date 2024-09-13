-- DropIndex
DROP INDEX "Notifications_groupName_key";

-- CreateTable
CREATE TABLE "Monitor" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "status" INTEGER NOT NULL,
    "frequency" INTEGER NOT NULL DEFAULT 30,
    "alertThreshold" INTEGER NOT NULL DEFAULT 1,
    "url" TEXT,
    "type" TEXT NOT NULL,
    "lastChanged" TIMESTAMP(3),
    "timeout" INTEGER NOT NULL DEFAULT 10,
    "uptime" INTEGER NOT NULL DEFAULT 0,
    "redirects" INTEGER NOT NULL DEFAULT 0,
    "method" TEXT,
    "headers" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "httpAuthMethod" TEXT,
    "basicAuthUser" TEXT,
    "basicAuthPass" TEXT,
    "bearerToken" TEXT,
    "contentType" TEXT,
    "statusCode" TEXT,
    "responseTime" TEXT,
    "connection" TEXT,
    "port" INTEGER,

    CONSTRAINT "Monitor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Monitor_userId_idx" ON "Monitor"("userId");

-- AddForeignKey
ALTER TABLE "Monitor" ADD CONSTRAINT "Monitor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
