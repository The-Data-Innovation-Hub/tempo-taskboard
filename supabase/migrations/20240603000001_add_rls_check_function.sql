-- Function to check if a table has RLS enabled
CREATE OR REPLACE FUNCTION check_table_rls(table_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'has_rls', relrowsecurity,
    'table_name', table_name
  ) INTO result
  FROM pg_class
  WHERE oid = (table_name::regclass);
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'error', SQLERRM,
    'table_name', table_name
  );
END;
$$;