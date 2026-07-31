-- Products with order history are archived instead of physically deleted.
ALTER TABLE `Product` ADD COLUMN `deletedAt` DATETIME(3) NULL;

CREATE INDEX `Product_deletedAt_idx` ON `Product`(`deletedAt`);
