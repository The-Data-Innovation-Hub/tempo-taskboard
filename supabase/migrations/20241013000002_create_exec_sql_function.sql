-- Create a function to execute arbitrary SQL
-- This is needed for the run_migration edge function to work

CREATE OR REPLACE FUNCTION exec_sql(query text) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  result jsonb;
BEGIN
  EXECUTE query;
  result := '{"success": true}'::jsonb;
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  result := jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
  RETURN result;
END;
$$;
