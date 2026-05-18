-- Step 1: Extend ENUM to include both old and new values
ALTER TABLE `Order` MODIFY COLUMN `status`
  ENUM('EN_COURS','LIVREE','ANNULEE','PENDING','CONFIRMED','PREPARING','READY','DELIVERED')
  NOT NULL DEFAULT 'PENDING';

-- Step 2: Migrate existing data to new values
UPDATE `Order` SET `status` = 'PENDING'   WHERE `status` = 'EN_COURS';
UPDATE `Order` SET `status` = 'DELIVERED' WHERE `status` = 'LIVREE';
UPDATE `Order` SET `status` = 'DELIVERED' WHERE `status` = 'ANNULEE';

-- Step 3: Remove old enum values
ALTER TABLE `Order` MODIFY COLUMN `status`
  ENUM('PENDING','CONFIRMED','PREPARING','READY','DELIVERED')
  NOT NULL DEFAULT 'PENDING';
