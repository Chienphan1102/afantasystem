/*
  Warnings:

  - Added the required column `salt` to the `PlatformAccount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tag` to the `PlatformAccount` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PlatformAccount" ADD COLUMN     "salt" BYTEA NOT NULL,
ADD COLUMN     "tag" BYTEA NOT NULL;
