CREATE TABLE `UploadAsset` (
  `id` VARCHAR(191) NOT NULL,
  `ownerId` INTEGER NULL,
  `visibility` VARCHAR(16) NOT NULL,
  `purpose` VARCHAR(32) NOT NULL,
  `originalName` VARCHAR(191) NOT NULL,
  `contentType` VARCHAR(100) NOT NULL,
  `bytes` LONGBLOB NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `UploadAsset_ownerId_idx` (`ownerId`),
  INDEX `UploadAsset_visibility_purpose_idx` (`visibility`, `purpose`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `RateLimitBucket` (
  `key` VARCHAR(191) NOT NULL,
  `count` INTEGER NOT NULL DEFAULT 0,
  `windowStart` DATETIME(3) NOT NULL,
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `UploadAsset`
  ADD CONSTRAINT `UploadAsset_ownerId_fkey`
  FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
