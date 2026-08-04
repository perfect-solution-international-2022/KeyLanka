CREATE TABLE `Condition` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `Condition_slug_key`(`slug`),
  INDEX `Condition_name_idx`(`name`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Product` ADD COLUMN `conditionId` INTEGER NULL;
ALTER TABLE `ProductVariant` ADD COLUMN `conditionId` INTEGER NULL;
CREATE INDEX `Product_conditionId_idx` ON `Product`(`conditionId`);
CREATE INDEX `ProductVariant_conditionId_idx` ON `ProductVariant`(`conditionId`);
ALTER TABLE `Product` ADD CONSTRAINT `Product_conditionId_fkey` FOREIGN KEY (`conditionId`) REFERENCES `Condition`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `ProductVariant` ADD CONSTRAINT `ProductVariant_conditionId_fkey` FOREIGN KEY (`conditionId`) REFERENCES `Condition`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
