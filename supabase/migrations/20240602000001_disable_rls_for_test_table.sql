-- Disable RLS for the supabase_test table to allow data retrieval without authentication
ALTER TABLE IF EXISTS supabase_test DISABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for all users
DROP POLICY IF EXISTS "Allow all operations for all users" ON supabase_test;
CREATE POLICY "Allow all operations for all users"
ON supabase_test
FOR ALL
USING (true)
WITH CHECK (true);

-- Check if table is already in the publication before adding it
DO $
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'supabase_test'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE supabase_test';
  END IF;
END
$;