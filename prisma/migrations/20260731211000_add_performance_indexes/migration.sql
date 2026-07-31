CREATE INDEX `Product_deletedAt_featured_createdAt_idx` ON `Product`(`deletedAt`, `featured`, `createdAt`);
CREATE INDEX `Product_deletedAt_categoryId_idx` ON `Product`(`deletedAt`, `categoryId`);
CREATE INDEX `Order_deletedAt_status_createdAt_idx` ON `Order`(`deletedAt`, `status`, `createdAt`);
CREATE INDEX `Order_userId_deletedAt_createdAt_idx` ON `Order`(`userId`, `deletedAt`, `createdAt`);
