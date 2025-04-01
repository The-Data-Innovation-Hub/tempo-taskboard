-- Drop existing policies
DROP POLICY IF EXISTS "Users can read all users" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own user" ON public.users;

-- Create more permissive policies
-- Allow any authenticated user to read all users
CREATE POLICY "Users can read all users"
  ON public.users
  FOR SELECT
  USING (true);

-- Allow any authenticated user to insert users
CREATE POLICY "Users can insert users"
  ON public.users
  FOR INSERT
  WITH CHECK (true);

-- Allow any authenticated user to update users
CREATE POLICY "Users can update users"
  ON public.users
  FOR UPDATE
  USING (true);
