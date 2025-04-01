-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable row level security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read users
DROP POLICY IF EXISTS "Users can read all users" ON public.users;
CREATE POLICY "Users can read all users"
  ON public.users
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to insert their own user
DROP POLICY IF EXISTS "Users can insert their own user" ON public.users;
CREATE POLICY "Users can insert their own user"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Enable realtime for users
-- Note: Not adding to publication as it's defined as FOR ALL TABLES