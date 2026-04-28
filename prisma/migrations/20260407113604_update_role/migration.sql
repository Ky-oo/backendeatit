/*
  Warnings:

  - You are about to drop the column `roles` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `User` DROP COLUMN `roles`,
    ADD COLUMN `role` VARCHAR(191) NOT NULL DEFAULT 'USER';
