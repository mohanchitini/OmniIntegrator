-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrelloToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrelloToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CliqToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "botToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CliqToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrelloBoard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "closed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrelloBoard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrelloList" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" DOUBLE PRECISION NOT NULL,
    "closed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrelloList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrelloCard" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "labels" TEXT,
    "members" TEXT,
    "position" DOUBLE PRECISION NOT NULL,
    "closed" BOOLEAN NOT NULL DEFAULT false,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrelloCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIInsights" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "summary" TEXT,
    "priority" TEXT,
    "sentiment" TEXT,
    "tags" TEXT,
    "analytics" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIInsights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "TrelloToken_userId_idx" ON "TrelloToken"("userId");

-- AddForeignKey
ALTER TABLE "TrelloToken" ADD CONSTRAINT "TrelloToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "CliqToken_userId_idx" ON "CliqToken"("userId");

-- AddForeignKey
ALTER TABLE "CliqToken" ADD CONSTRAINT "CliqToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "TrelloBoard_userId_idx" ON "TrelloBoard"("userId");

-- CreateIndex
CREATE INDEX "TrelloList_boardId_idx" ON "TrelloList"("boardId");

-- AddForeignKey
ALTER TABLE "TrelloList" ADD CONSTRAINT "TrelloList_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "TrelloBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "TrelloCard_listId_idx" ON "TrelloCard"("listId");

-- AddForeignKey
ALTER TABLE "TrelloCard" ADD CONSTRAINT "TrelloCard_listId_fkey" FOREIGN KEY ("listId") REFERENCES "TrelloList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "AIInsights_cardId_idx" ON "AIInsights"("cardId");

-- AddForeignKey
ALTER TABLE "AIInsights" ADD CONSTRAINT "AIInsights_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "TrelloCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "SyncLog_userId_idx" ON "SyncLog"("userId");

-- CreateIndex
CREATE INDEX "SyncLog_createdAt_idx" ON "SyncLog"("createdAt");

-- AddForeignKey
ALTER TABLE "SyncLog" ADD CONSTRAINT "SyncLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
