-- Enable RLS on the test table if it's not already enabled
ALTER TABLE IF EXISTS supabase_test ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations for all users" ON supabase_test;

-- Create a policy that allows all operations for all users
CREATE POLICY "Allow all operations for all users"
ON supabase_test
FOR ALL
USING (true)
WITH CHECK (true);

-- Make sure the table is part of the realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'supabase_test'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE supabase_test;
  END IF;
END
$$;
