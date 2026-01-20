-- Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'lawyer';

-- Create index on role for better query performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
