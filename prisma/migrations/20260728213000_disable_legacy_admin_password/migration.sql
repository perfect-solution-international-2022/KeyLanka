ALTER TABLE `User`
  ADD COLUMN `mustResetPassword` BOOLEAN NOT NULL DEFAULT false;

-- The original seed shipped this public address with a hardcoded password.
-- Require a verified reset before it can authenticate again.
UPDATE `User`
SET `mustResetPassword` = true,
    `sessionVersion` = `sessionVersion` + 1
WHERE `email` = 'admin@keylanka.lk'
  AND `role` = 'ADMIN';
