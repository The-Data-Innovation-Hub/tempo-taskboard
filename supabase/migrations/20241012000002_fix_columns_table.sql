-- Fix columns table to ensure it exists and has proper structure

-- Ensure columns table exists with proper structure
CREATE TABLE IF NOT EXISTS columns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Disable RLS on columns table
ALTER TABLE IF EXISTS columns DISABLE ROW LEVEL SECURITY;

-- Enable realtime for columns table
alter publication supabase_realtime add table columns;
