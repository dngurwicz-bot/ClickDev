-- Multi-Organization Support Migration
-- Allow users to belong to multiple organizations

-- Step 1: Add is_primary column
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;

-- Step 2: Set existing users as primary in their current org
UPDATE user_roles SET is_primary = true;

-- Step 3: Create index for faster queries on primary org
CREATE INDEX IF NOT EXISTS idx_user_roles_user_primary ON user_roles(user_id, is_primary) WHERE is_primary = true;
