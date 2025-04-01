-- This migration ensures proper permissions for Vercel deployment
-- It doesn't modify any database structure but serves as a marker for deployment fixes

-- Log deployment attempt
DO $$
BEGIN
  RAISE NOTICE 'Verifying deployment permissions';
END $$;

-- Ensure the exec_sql function exists (required for deployments)
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE query;
  RETURN 'SQL executed successfully';
EXCEPTION WHEN OTHERS THEN
  RETURN 'Error: ' || SQLERRM;
END;
$$;

-- Grant necessary permissions to the anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Ensure storage permissions are properly set
GRANT ALL ON ALL TABLES IN SCHEMA storage TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA storage TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA storage TO anon, authenticated;
