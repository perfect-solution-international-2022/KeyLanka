CREATE TABLE `MaintenanceSettings` (
  `id` INTEGER NOT NULL DEFAULT 1,
  `enabled` BOOLEAN NOT NULL DEFAULT false,
  `message` VARCHAR(500) NULL,
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `MaintenanceSettings` (`id`, `enabled`, `message`, `updatedAt`)
VALUES (1, false, NULL, CURRENT_TIMESTAMP(3));
