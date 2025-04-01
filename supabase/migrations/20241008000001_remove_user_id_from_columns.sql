-- Create a simple policy that allows all authenticated users to perform all operations
DROP POLICY IF EXISTS "Allow all operations on columns" ON columns;
CREATE POLICY "Allow all operations on columns"
ON columns
USING (true)
WITH CHECK (true);

-- Make sure realtime is enabled for columns table
ALTER PUBLICATION supabase_realtime ADD TABLE columns;
