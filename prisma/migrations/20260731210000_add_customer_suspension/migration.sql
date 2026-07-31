ALTER TABLE `User`
    ADD COLUMN `suspendedAt` DATETIME(3) NULL,
    ADD COLUMN `suspensionReason` TEXT NULL;

CREATE INDEX `User_role_suspendedAt_idx` ON `User`(`role`, `suspendedAt`);
