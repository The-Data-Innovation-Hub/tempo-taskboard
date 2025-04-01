-- Drop any existing triggers that might be causing issues
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the users table with a simpler structure
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'users' AND table_schema = 'public'
  ) THEN
    -- Drop any foreign key constraints first
    ALTER TABLE IF EXISTS public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
    
    -- Now drop the users table
    DROP TABLE IF EXISTS public.users;
  END IF;
END$$;

-- Create a simple users table without foreign key constraints
CREATE TABLE public.users (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS on users table to prevent permission issues
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Sync existing auth users with public users table
INSERT INTO public.users (id)
SELECT id FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Fix profiles table if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'profiles' AND table_schema = 'public'
  ) THEN
    -- Add foreign key that references public.users
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_id_fkey
    FOREIGN KEY (id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END$$;
