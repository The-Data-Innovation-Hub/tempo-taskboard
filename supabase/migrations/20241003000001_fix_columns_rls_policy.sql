-- Disable RLS for columns table to allow all operations
ALTER TABLE columns DISABLE ROW LEVEL SECURITY;

-- Create a policy that allows all users to perform all operations on columns
DROP POLICY IF EXISTS "Allow all operations on columns" ON columns;
CREATE POLICY "Allow all operations on columns"
  ON columns
  USING (true)
  WITH CHECK (true);

-- Enable realtime for columns table
alter publication supabase_realtime add table columns;
