-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rawInput" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "contentType" TEXT NOT NULL DEFAULT 'learned',
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
    "impressions" INTEGER,
    "likes" INTEGER,
    "comments" INTEGER,
    "shares" INTEGER,
    "wasEdited" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Post" ("content", "contentType", "createdAt", "format", "hashtags", "id", "imageStrategy", "notes", "postedDate", "rawInput", "scheduledDate", "source", "status", "title", "topicCategory", "updatedAt") SELECT "content", "contentType", "createdAt", "format", "hashtags", "id", "imageStrategy", "notes", "postedDate", "rawInput", "scheduledDate", "source", "status", "title", "topicCategory", "updatedAt" FROM "Post";
DROP TABLE "Post";
ALTER TABLE "new_Post" RENAME TO "Post";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
