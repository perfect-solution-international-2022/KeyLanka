UPDATE `Product`
SET `wholesaleMinQty` = 10
WHERE `wholesaleMinQty` IS NULL;

ALTER TABLE `Product`
    MODIFY COLUMN `wholesaleMinQty` INTEGER NOT NULL DEFAULT 10;

DROP TABLE IF EXISTS `StoreSettings`;
