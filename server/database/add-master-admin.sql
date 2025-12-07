-- Add Master Admin System
-- سیستم مستر ادمین - بالاترین سطح دسترسی

-- Add is_master_admin column to admin_users
ALTER TABLE admin_users ADD COLUMN is_master_admin BOOLEAN DEFAULT 0;

-- Add created_by_master column to track who created the admin
ALTER TABLE admin_users ADD COLUMN created_by_master INTEGER;

-- Create index for master admin
CREATE INDEX IF NOT EXISTS idx_admin_users_master ON admin_users(is_master_admin);

-- Update existing super admin to master admin (first super admin becomes master)
UPDATE admin_users 
SET is_master_admin = 1 
WHERE id = (SELECT MIN(id) FROM admin_users WHERE is_super_admin = 1);
