ALTER TABLE `Order`
  ADD COLUMN `shippingCost` DECIMAL(10, 2) NOT NULL DEFAULT 0.00;

CREATE TABLE `ShippingSettings` (
  `id` INTEGER NOT NULL DEFAULT 1,
  `shippingCost` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `ShippingSettings` (`id`, `shippingCost`, `updatedAt`)
VALUES (1, 0.00, CURRENT_TIMESTAMP(3));
