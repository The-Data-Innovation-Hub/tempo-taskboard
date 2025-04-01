-- Create storage buckets if they don't exist
-- This version uses direct SQL commands without requiring external credentials

-- Enable the pgcrypto extension for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create the task_files bucket if it doesn't exist
DO $$
BEGIN
  -- Check if the task_files bucket exists
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'task_files'
  ) THEN
    -- Create the task_files bucket
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('task_files', 'task_files', true);
  END IF;

  -- Check if the avatars bucket exists
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'avatars'
  ) THEN
    -- Create the avatars bucket
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('avatars', 'avatars', true);
  END IF;

EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't fail the migration
  RAISE NOTICE 'Error creating storage buckets: %', SQLERRM;
END;
$$;

-- Create RLS policies for the storage.objects table
DO $$
BEGIN
  -- Allow public read access
  DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
  CREATE POLICY "Allow public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('task_files', 'avatars'));

  -- Allow authenticated users to upload files
  DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
  CREATE POLICY "Allow authenticated users to upload files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id IN ('task_files', 'avatars'));

  -- Allow users to update their own files
  DROP POLICY IF EXISTS "Allow users to update their own files" ON storage.objects;
  CREATE POLICY "Allow users to update their own files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id IN ('task_files', 'avatars') AND (auth.uid() = owner));

  -- Allow users to delete their own files
  DROP POLICY IF EXISTS "Allow users to delete their own files" ON storage.objects;
  CREATE POLICY "Allow users to delete their own files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id IN ('task_files', 'avatars') AND (auth.uid() = owner));

EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't fail the migration
  RAISE NOTICE 'Error creating RLS policies: %', SQLERRM;
END;
$$;

-- Create task_files table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.task_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Try to add to realtime publication
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.task_files;
  ALTER PUBLICATION supabase_realtime ADD TABLE storage.objects;
EXCEPTION WHEN undefined_object THEN
  RAISE NOTICE 'Publication supabase_realtime does not exist, skipping';
WHEN duplicate_object THEN
  RAISE NOTICE 'Table already in publication, skipping';
END;
$$;

-- Enable RLS on task_files table
ALTER TABLE public.task_files ENABLE ROW LEVEL SECURITY;

-- Create policies for task_files table
DO $$
BEGIN
  -- Users can view task files
  DROP POLICY IF EXISTS "Users can view their own task files" ON public.task_files;
  CREATE POLICY "Users can view their own task files"
    ON public.task_files FOR SELECT
    USING (true);

  -- Users can insert task files
  DROP POLICY IF EXISTS "Users can insert their own task files" ON public.task_files;
  CREATE POLICY "Users can insert their own task files"
    ON public.task_files FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

  -- Users can update task files
  DROP POLICY IF EXISTS "Users can update their own task files" ON public.task_files;
  CREATE POLICY "Users can update their own task files"
    ON public.task_files FOR UPDATE
    USING (auth.role() = 'authenticated');

  -- Users can delete task files
  DROP POLICY IF EXISTS "Users can delete their own task files" ON public.task_files;
  CREATE POLICY "Users can delete their own task files"
    ON public.task_files FOR DELETE
    USING (auth.role() = 'authenticated');

EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't fail the migration
  RAISE NOTICE 'Error creating task_files policies: %', SQLERRM;
END;
$$;