-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "rawInput" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "contentType" TEXT NOT NULL DEFAULT 'learned',
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "imageStrategy" TEXT NOT NULL,
    "hashtags" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'draft',
    "source" TEXT NOT NULL DEFAULT 'user',
    "topicCategory" TEXT,
    "scheduledDate" TIMESTAMP(3),
    "postedDate" TIMESTAMP(3),
    "notes" TEXT,
    "impressions" INTEGER,
    "likes" INTEGER,
    "comments" INTEGER,
    "shares" INTEGER,
    "wasEdited" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyTarget" (
    "id" TEXT NOT NULL,
    "postsPerWeek" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyTarget_pkey" PRIMARY KEY ("id")
);
