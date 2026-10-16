-- These fields existed in schema.prisma but were missing from migration history.
-- Restore them before the performance indexes that reference Product.featured.
ALTER TABLE `Category`
    ADD COLUMN `restricted` BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE `Product`
    ADD COLUMN `wholesalePrice` DECIMAL(10, 2) NULL,
    ADD COLUMN `featured` BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE `User`
    ADD COLUMN `locksmithStatus` VARCHAR(191) NULL;

ALTER TABLE `Order`
    ADD COLUMN `shippingDistrict` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `shippingPostalCode` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `paid` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `transactionId` VARCHAR(191) NULL,
    ADD COLUMN `paymentStatusMessage` VARCHAR(191) NULL;

CREATE UNIQUE INDEX `Order_transactionId_key` ON `Order`(`transactionId`);

CREATE TABLE `LocksmithApplication` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `mobileNumber` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `businessName` VARCHAR(191) NOT NULL,
    `businessRegDocs` JSON NOT NULL,
    `nationalIdFront` VARCHAR(191) NOT NULL,
    `nationalIdBack` VARCHAR(191) NOT NULL,
    `address` TEXT NOT NULL,
    `utilityBillDoc` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `rejectionReason` TEXT NULL,
    `reviewedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `LocksmithApplication_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `LocksmithApplication`
    ADD CONSTRAINT `LocksmithApplication_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
