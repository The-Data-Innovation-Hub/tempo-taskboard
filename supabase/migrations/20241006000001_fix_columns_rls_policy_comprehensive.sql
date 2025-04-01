-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Allow users to select columns they have access to" ON columns;
DROP POLICY IF EXISTS "Allow users to insert columns they have access to" ON columns;
DROP POLICY IF EXISTS "Allow users to update columns they have access to" ON columns;
DROP POLICY IF EXISTS "Allow users to delete columns they have access to" ON columns;

-- Enable RLS on columns table
ALTER TABLE columns ENABLE ROW LEVEL SECURITY;

-- Create a very permissive policy for selecting columns
CREATE POLICY "Allow users to select columns they have access to"
ON columns FOR SELECT
USING (true);

-- Create a permissive policy for inserting columns
CREATE POLICY "Allow users to insert columns they have access to"
ON columns FOR INSERT
WITH CHECK (true);

-- Create a permissive policy for updating columns
CREATE POLICY "Allow users to update columns they have access to"
ON columns FOR UPDATE
USING (true);

-- Create a permissive policy for deleting columns
CREATE POLICY "Allow users to delete columns they have access to"
ON columns FOR DELETE
USING (true);

-- Enable realtime for columns table
alter publication supabase_realtime add table columns;
