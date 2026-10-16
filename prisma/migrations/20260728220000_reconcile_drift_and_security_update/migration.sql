-- Remove legacy objects that were created directly in production, outside the
-- migration history. They do not exist when replaying into an empty database.
-- Dropping the child table also removes its foreign key to ProductAttribute.
DROP TABLE IF EXISTS `ProductAttributeValue`;
DROP TABLE IF EXISTS `ProductAttribute`;
DROP TABLE IF EXISTS `Promotion`;

-- MySQL does not support DROP COLUMN IF EXISTS. Check for the production-only
-- column before preparing the statement so shadow database replay is safe.
SET @drop_admin_data = (
    SELECT IF(COUNT(*) > 0,
        'ALTER TABLE `Product` DROP COLUMN `adminData`',
        'SELECT 1')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Product'
      AND COLUMN_NAME = 'adminData'
);
PREPARE drop_admin_data_statement FROM @drop_admin_data;
EXECUTE drop_admin_data_statement;
DEALLOCATE PREPARE drop_admin_data_statement;

-- Product tabs, shipping settings, uploads, rate limits, security tables and
-- the legacy admin password reset are already handled by earlier migrations.
-- Repeating them here causes duplicate columns/tables and resets sessions twice.
