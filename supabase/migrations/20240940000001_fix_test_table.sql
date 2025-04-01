-- Create the supabase_test table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.supabase_test (
  test_id TEXT PRIMARY KEY,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure RLS is disabled for this test table
ALTER TABLE public.supabase_test DISABLE ROW LEVEL SECURITY;

-- Don't add to realtime publication since it's defined as FOR ALL TABLES
-- This was causing the error
