-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT,
    "googleId" TEXT,
    "facebookId" TEXT,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notifications" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "groupName" TEXT NOT NULL,
    "emails" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Monitor" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "notificationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "status" INTEGER NOT NULL,
    "frequency" INTEGER NOT NULL DEFAULT 30,
    "alertThreshold" INTEGER NOT NULL DEFAULT 1,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "lastChanged" TIMESTAMP(3),
    "timeout" INTEGER NOT NULL DEFAULT 10,
    "uptime" INTEGER NOT NULL DEFAULT 0,
    "redirects" INTEGER NOT NULL DEFAULT 0,
    "method" TEXT,
    "headers" TEXT,
    "body" TEXT,
    "httpAuthMethod" TEXT,
    "basicAuthUser" TEXT,
    "basicAuthPass" TEXT,
    "bearerToken" TEXT,
    "contentType" TEXT,
    "statusCode" TEXT,
    "responseTime" TEXT,
    "connection" TEXT,
    "port" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Monitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HttpHeartbeat" (
    "id" SERIAL NOT NULL,
    "monitorId" INTEGER NOT NULL,
    "status" INTEGER NOT NULL,
    "code" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "reqHeaders" TEXT,
    "resHeaders" TEXT,
    "reqBody" TEXT,
    "resBody" TEXT,
    "responseTime" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "HttpHeartbeat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_username_email_idx" ON "User"("username", "email");

-- CreateIndex
CREATE INDEX "Notifications_userId_idx" ON "Notifications"("userId");

-- CreateIndex
CREATE INDEX "Monitor_userId_idx" ON "Monitor"("userId");

-- CreateIndex
CREATE INDEX "HttpHeartbeat_monitorId_idx" ON "HttpHeartbeat"("monitorId");

-- AddForeignKey
ALTER TABLE "Notifications" ADD CONSTRAINT "Notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Monitor" ADD CONSTRAINT "Monitor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
