-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rawInput" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "imageStrategy" TEXT NOT NULL,
    "hashtags" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "source" TEXT NOT NULL DEFAULT 'user',
    "topicCategory" TEXT,
    "scheduledDate" DATETIME,
    "postedDate" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WeeklyTarget" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postsPerWeek" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" DATETIME NOT NULL
);
