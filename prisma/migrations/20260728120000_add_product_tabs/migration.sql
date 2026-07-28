ALTER TABLE `Product`
    ADD COLUMN `wholesaleMinQty` INTEGER NULL,
    ADD COLUMN `lowStockThreshold` INTEGER NOT NULL DEFAULT 10,
    ADD COLUMN `allowBackorder` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `soldIndividually` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `shortDescription` TEXT NULL,
    ADD COLUMN `seoTitle` VARCHAR(191) NULL,
    ADD COLUMN `metaDescription` TEXT NULL,
    ADD COLUMN `focusKeywords` TEXT NULL,
    ADD COLUMN `imageAlt` VARCHAR(191) NULL;
