ALTER TABLE `Category` ADD COLUMN `deletedAt` DATETIME(3) NULL;
ALTER TABLE `Brand` ADD COLUMN `deletedAt` DATETIME(3) NULL;
ALTER TABLE `Attribute` ADD COLUMN `deletedAt` DATETIME(3) NULL;
ALTER TABLE `AttributeValue` ADD COLUMN `deletedAt` DATETIME(3) NULL;
ALTER TABLE `Service` ADD COLUMN `deletedAt` DATETIME(3) NULL;

CREATE INDEX `Category_deletedAt_idx` ON `Category`(`deletedAt`);
CREATE INDEX `Brand_deletedAt_idx` ON `Brand`(`deletedAt`);
CREATE INDEX `Attribute_deletedAt_idx` ON `Attribute`(`deletedAt`);
CREATE INDEX `AttributeValue_deletedAt_idx` ON `AttributeValue`(`deletedAt`);
CREATE INDEX `Service_deletedAt_idx` ON `Service`(`deletedAt`);
