CREATE TABLE `BankTransferSettings` (
  `id` INTEGER NOT NULL DEFAULT 1,
  `enabled` BOOLEAN NOT NULL DEFAULT false,
  `bankName` VARCHAR(120) NOT NULL DEFAULT '',
  `branchName` VARCHAR(120) NOT NULL DEFAULT '',
  `accountName` VARCHAR(160) NOT NULL DEFAULT '',
  `accountNumber` VARCHAR(80) NOT NULL DEFAULT '',
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `BankTransferSettings`
  (`id`, `enabled`, `bankName`, `branchName`, `accountName`, `accountNumber`, `updatedAt`)
VALUES (1, false, '', '', '', '', CURRENT_TIMESTAMP(3));

ALTER TABLE `Order`
  ADD COLUMN `paymentSlipAssetId` VARCHAR(191) NULL,
  ADD UNIQUE INDEX `Order_paymentSlipAssetId_key`(`paymentSlipAssetId`),
  ADD CONSTRAINT `Order_paymentSlipAssetId_fkey`
    FOREIGN KEY (`paymentSlipAssetId`) REFERENCES `UploadAsset`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
