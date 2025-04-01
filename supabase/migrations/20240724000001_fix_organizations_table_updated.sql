-- Check if organizations table exists and create it if not
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  logo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_default BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their organizations" ON organizations;
CREATE POLICY "Users can insert their organizations"
  ON organizations FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their organizations" ON organizations;
CREATE POLICY "Users can update their organizations"
  ON organizations FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Users can delete their organizations" ON organizations;
CREATE POLICY "Users can delete their organizations"
  ON organizations FOR DELETE
  USING (true);
