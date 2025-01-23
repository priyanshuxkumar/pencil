/*
  Warnings:

  - You are about to drop the `_BoardToUser` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `userId` to the `Board` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_BoardToUser" DROP CONSTRAINT "_BoardToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_BoardToUser" DROP CONSTRAINT "_BoardToUser_B_fkey";

-- AlterTable
ALTER TABLE "Board" ADD COLUMN     "userId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "_BoardToUser";

-- AddForeignKey
ALTER TABLE "Board" ADD CONSTRAINT "Board_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
