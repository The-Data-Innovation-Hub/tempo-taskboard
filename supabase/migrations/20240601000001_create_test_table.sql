-- Create a test table for validating Supabase connection
CREATE TABLE IF NOT EXISTS supabase_test (
  test_id TEXT PRIMARY KEY,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable row level security
ALTER TABLE supabase_test ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations
DROP POLICY IF EXISTS "Allow all operations" ON supabase_test;
CREATE POLICY "Allow all operations"
  ON supabase_test
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create a function to create the test table if it doesn't exist
CREATE OR REPLACE FUNCTION create_test_table_if_not_exists()
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS supabase_test (
    test_id TEXT PRIMARY KEY,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- Enable row level security
  ALTER TABLE supabase_test ENABLE ROW LEVEL SECURITY;
  
  -- Create a policy that allows all operations
  BEGIN
    DROP POLICY IF EXISTS "Allow all operations" ON supabase_test;
  EXCEPTION WHEN undefined_table THEN
    -- Do nothing, policy doesn't exist
  END;
  
  BEGIN
    CREATE POLICY "Allow all operations"
      ON supabase_test
      FOR ALL
      USING (true)
      WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN
    -- Do nothing, policy already exists
  END;
END;
$$ LANGUAGE plpgsql;

-- Enable realtime for the test table
ALTER PUBLICATION supabase_realtime ADD TABLE supabase_test;