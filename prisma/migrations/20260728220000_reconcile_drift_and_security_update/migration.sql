-- Reconciles untracked schema drift (adminData, ProductAttribute/Value, Promotion tables
-- applied directly to production on 2026-07-26 outside of git) with the schema now
-- shipped from GitHub, then applies the new security/shipping/product-tab changes.

ALTER TABLE `ProductAttributeValue` DROP FOREIGN KEY `ProductAttributeValue_attributeId_fkey`;
DROP TABLE `ProductAttributeValue`;
DROP TABLE `ProductAttribute`;
DROP TABLE `Promotion`;

ALTER TABLE `Order` ADD COLUMN `shippingCost` DECIMAL(10, 2) NOT NULL DEFAULT 0;

ALTER TABLE `Product` DROP COLUMN `adminData`,
    ADD COLUMN `allowBackorder` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `focusKeywords` TEXT NULL,
    ADD COLUMN `imageAlt` VARCHAR(191) NULL,
    ADD COLUMN `lowStockThreshold` INTEGER NOT NULL DEFAULT 10,
    ADD COLUMN `metaDescription` TEXT NULL,
    ADD COLUMN `seoTitle` VARCHAR(191) NULL,
    ADD COLUMN `shortDescription` TEXT NULL,
    ADD COLUMN `soldIndividually` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `wholesaleMinQty` INTEGER NOT NULL DEFAULT 10;

ALTER TABLE `User` ADD COLUMN `mustResetPassword` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `sessionVersion` INTEGER NOT NULL DEFAULT 0;

DROP TABLE `StoreSettings`;

CREATE TABLE `AdminLoginChallenge` (
    `id` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,
    `codeHash` CHAR(64) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `consumedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `AdminLoginChallenge_userId_expiresAt_idx`(`userId`, `expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `SecurityAuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `actorUserId` INTEGER NULL,
    `action` VARCHAR(64) NOT NULL,
    `targetType` VARCHAR(64) NULL,
    `targetId` VARCHAR(191) NULL,
    `ipHash` CHAR(64) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `SecurityAuditLog_createdAt_idx`(`createdAt`),
    INDEX `SecurityAuditLog_action_createdAt_idx`(`action`, `createdAt`),
    INDEX `SecurityAuditLog_actorUserId_createdAt_idx`(`actorUserId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `UploadAsset` (
    `id` VARCHAR(191) NOT NULL,
    `ownerId` INTEGER NULL,
    `visibility` VARCHAR(16) NOT NULL,
    `purpose` VARCHAR(32) NOT NULL,
    `originalName` VARCHAR(191) NOT NULL,
    `contentType` VARCHAR(100) NOT NULL,
    `bytes` LONGBLOB NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `UploadAsset_ownerId_idx`(`ownerId`),
    INDEX `UploadAsset_visibility_purpose_idx`(`visibility`, `purpose`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `RateLimitBucket` (
    `key` VARCHAR(191) NOT NULL,
    `count` INTEGER NOT NULL DEFAULT 0,
    `windowStart` DATETIME(3) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ShippingSettings` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `shippingCost` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `ShippingSettings` (`id`, `shippingCost`, `updatedAt`)
VALUES (1, 0.00, CURRENT_TIMESTAMP(3));

ALTER TABLE `AdminLoginChallenge` ADD CONSTRAINT `AdminLoginChallenge_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `SecurityAuditLog` ADD CONSTRAINT `SecurityAuditLog_actorUserId_fkey` FOREIGN KEY (`actorUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `UploadAsset` ADD CONSTRAINT `UploadAsset_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

UPDATE `User`
SET `mustResetPassword` = true,
    `sessionVersion` = `sessionVersion` + 1
WHERE `email` = 'admin@keylanka.lk'
  AND `role` = 'ADMIN';
