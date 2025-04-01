-- Create the task_files table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.task_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add realtime
ALTER PUBLICATION supabase_realtime ADD TABLE task_files;

-- Set up RLS
ALTER TABLE public.task_files ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Allow full access to all users" ON public.task_files;
CREATE POLICY "Allow full access to all users"
  ON public.task_files
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policy for public access to files
DROP POLICY IF EXISTS "Allow public read access" ON public.task_files;
CREATE POLICY "Allow public read access"
  ON public.task_files
  FOR SELECT
  TO anon
  USING (true);
