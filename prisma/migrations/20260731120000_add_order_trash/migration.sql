-- Orders are retained for audit/history when an administrator deletes them.
ALTER TABLE `Order` ADD COLUMN `deletedAt` DATETIME(3) NULL;

CREATE INDEX `Order_deletedAt_idx` ON `Order`(`deletedAt`);
