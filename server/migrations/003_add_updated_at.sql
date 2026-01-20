-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add organization column for compatibility
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization TEXT DEFAULT '';

-- Update existing records
UPDATE users SET updated_at = created_at WHERE updated_at IS NULL;
