-- First, make sure RLS is enabled for the test table
ALTER TABLE supabase_test ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow full access to all users" ON supabase_test;

-- Create a permissive policy that allows all operations for authenticated and anon users
CREATE POLICY "Allow full access to all users"
ON supabase_test
FOR ALL
USING (true)
WITH CHECK (true);

-- Make sure the table is part of the realtime publication without recreating the entire publication
DO $$
BEGIN
  -- Check if the table is already in the publication
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'supabase_test'
  ) THEN
    -- Table is already in the publication, do nothing
    NULL;
  ELSE
    -- Add the table to the publication
    ALTER PUBLICATION supabase_realtime ADD TABLE supabase_test;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- If the publication doesn't exist, create it with just this table
  CREATE PUBLICATION supabase_realtime FOR TABLE supabase_test;
END
$$;
