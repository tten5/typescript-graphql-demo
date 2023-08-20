/*
  Warnings:

  - You are about to drop the `_Votes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_Votes" DROP CONSTRAINT "_Votes_A_fkey";

-- DropForeignKey
ALTER TABLE "_Votes" DROP CONSTRAINT "_Votes_B_fkey";

-- DropTable
DROP TABLE "_Votes";

-- CreateTable
CREATE TABLE "Vote" (
    "id" SERIAL NOT NULL,
    "linkId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vote_linkId_userId_key" ON "Vote"("linkId", "userId");

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "Link"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
