ALTER TABLE `User`
  ADD COLUMN `sessionVersion` INTEGER NOT NULL DEFAULT 0;

CREATE TABLE `AdminLoginChallenge` (
  `id` VARCHAR(191) NOT NULL,
  `userId` INTEGER NOT NULL,
  `codeHash` CHAR(64) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `attempts` INTEGER NOT NULL DEFAULT 0,
  `consumedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `AdminLoginChallenge_userId_expiresAt_idx` (`userId`, `expiresAt`),
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
  INDEX `SecurityAuditLog_createdAt_idx` (`createdAt`),
  INDEX `SecurityAuditLog_action_createdAt_idx` (`action`, `createdAt`),
  INDEX `SecurityAuditLog_actorUserId_createdAt_idx` (`actorUserId`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `AdminLoginChallenge`
  ADD CONSTRAINT `AdminLoginChallenge_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `SecurityAuditLog`
  ADD CONSTRAINT `SecurityAuditLog_actorUserId_fkey`
  FOREIGN KEY (`actorUserId`) REFERENCES `User`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
