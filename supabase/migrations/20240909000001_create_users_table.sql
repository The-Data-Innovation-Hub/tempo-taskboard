-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable row level security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy for users
DROP POLICY IF EXISTS "Users can view their own user record" ON public.users;
CREATE POLICY "Users can view their own user record"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Create policy for inserting mock users
DROP POLICY IF EXISTS "Allow insert for mock users" ON public.users;
CREATE POLICY "Allow insert for mock users"
  ON public.users
  FOR INSERT
  WITH CHECK (true);

-- Insert mock users if they don't exist
INSERT INTO public.users (id)
VALUES 
  ('00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

-- Add realtime support
alter publication supabase_realtime add table public.users;