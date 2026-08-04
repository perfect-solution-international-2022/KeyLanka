CREATE TABLE `Warranty` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(120) NOT NULL,
  `days` INTEGER NOT NULL,
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `active` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Policy` (
  `key` VARCHAR(40) NOT NULL,
  `title` VARCHAR(160) NOT NULL,
  `content` LONGTEXT NOT NULL,
  `version` INTEGER NOT NULL DEFAULT 1,
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `_ProductWarranties` (
  `A` INTEGER NOT NULL,
  `B` INTEGER NOT NULL,
  UNIQUE INDEX `_ProductWarranties_AB_unique`(`A`, `B`),
  INDEX `_ProductWarranties_B_index`(`B`),
  CONSTRAINT `_ProductWarranties_A_fkey` FOREIGN KEY (`A`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `_ProductWarranties_B_fkey` FOREIGN KEY (`B`) REFERENCES `Warranty`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `CartItem` ADD COLUMN `warrantyId` INTEGER NULL, ADD INDEX `CartItem_warrantyId_idx`(`warrantyId`), ADD CONSTRAINT `CartItem_warrantyId_fkey` FOREIGN KEY (`warrantyId`) REFERENCES `Warranty`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Order` ADD COLUMN `policyAgreement` JSON NULL;
ALTER TABLE `OrderItem` ADD COLUMN `warrantyName` VARCHAR(191) NULL, ADD COLUMN `warrantyDays` INTEGER NULL, ADD COLUMN `warrantyPrice` DECIMAL(10,2) NOT NULL DEFAULT 0;

INSERT INTO `Policy` (`key`,`title`,`content`,`version`,`updatedAt`) VALUES
('terms','Terms & Conditions','KeyLanka Terms & Conditions. Please update this content from the admin panel.',1,CURRENT_TIMESTAMP(3)),
('privacy','Privacy Policy','KeyLanka Privacy Policy. Please update this content from the admin panel.',1,CURRENT_TIMESTAMP(3)),
('refund','No Return & No Refund Policy','KeyLanka No Return & No Refund Policy. Please update this content from the admin panel.',1,CURRENT_TIMESTAMP(3)),
('warranty','Warranty Conditions','KeyLanka Warranty Conditions. Please update this content from the admin panel.',1,CURRENT_TIMESTAMP(3));
