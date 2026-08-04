CREATE TABLE `_ConditionToProduct` (
  `A` INTEGER NOT NULL,
  `B` INTEGER NOT NULL,
  UNIQUE INDEX `_ConditionToProduct_AB_unique`(`A`, `B`),
  INDEX `_ConditionToProduct_B_index`(`B`),
  CONSTRAINT `_ConditionToProduct_A_fkey` FOREIGN KEY (`A`) REFERENCES `Condition`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `_ConditionToProduct_B_fkey` FOREIGN KEY (`B`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `_ConditionToProductVariant` (
  `A` INTEGER NOT NULL,
  `B` INTEGER NOT NULL,
  UNIQUE INDEX `_ConditionToProductVariant_AB_unique`(`A`, `B`),
  INDEX `_ConditionToProductVariant_B_index`(`B`),
  CONSTRAINT `_ConditionToProductVariant_A_fkey` FOREIGN KEY (`A`) REFERENCES `Condition`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `_ConditionToProductVariant_B_fkey` FOREIGN KEY (`B`) REFERENCES `ProductVariant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `_ConditionToProduct` (`A`, `B`) SELECT `conditionId`, `id` FROM `Product` WHERE `conditionId` IS NOT NULL;
INSERT INTO `_ConditionToProductVariant` (`A`, `B`) SELECT `conditionId`, `id` FROM `ProductVariant` WHERE `conditionId` IS NOT NULL;

ALTER TABLE `Product` DROP FOREIGN KEY `Product_conditionId_fkey`;
ALTER TABLE `ProductVariant` DROP FOREIGN KEY `ProductVariant_conditionId_fkey`;
DROP INDEX `Product_conditionId_idx` ON `Product`;
DROP INDEX `ProductVariant_conditionId_idx` ON `ProductVariant`;
ALTER TABLE `Product` DROP COLUMN `conditionId`;
ALTER TABLE `ProductVariant` DROP COLUMN `conditionId`;
