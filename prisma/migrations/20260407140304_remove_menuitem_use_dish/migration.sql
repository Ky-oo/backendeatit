/*
  Warnings:

  - You are about to drop the column `menuItemId` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the `MenuItem` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `dishId` to the `OrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `MenuItem` DROP FOREIGN KEY `MenuItem_restaurantId_fkey`;

-- DropForeignKey
ALTER TABLE `OrderItem` DROP FOREIGN KEY `OrderItem_menuItemId_fkey`;

-- DropIndex
DROP INDEX `OrderItem_menuItemId_fkey` ON `OrderItem`;

-- AlterTable
ALTER TABLE `OrderItem` DROP COLUMN `menuItemId`,
    ADD COLUMN `dishId` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `MenuItem`;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_dishId_fkey` FOREIGN KEY (`dishId`) REFERENCES `Dish`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
