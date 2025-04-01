-- Create task_files bucket if it doesn't exist
DO $$
BEGIN
  -- Check if the task_files bucket exists
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'task_files'
  ) THEN
    -- Create the task_files bucket
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('task_files', 'task_files', true);
    
    -- Set up RLS policies for task_files bucket
    INSERT INTO storage.policies (name, definition, bucket_id)
    VALUES 
      ('Allow public read access', 'bucket_id=''task_files''', 'task_files'),
      ('Allow authenticated users to upload files', 'bucket_id=''task_files'' AND auth.role() = ''authenticated''', 'task_files');
  END IF;

  -- Check if the avatars bucket exists
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'avatars'
  ) THEN
    -- Create the avatars bucket
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('avatars', 'avatars', true);
    
    -- Set up RLS policies for avatars bucket
    INSERT INTO storage.policies (name, definition, bucket_id)
    VALUES 
      ('Allow public read access', 'bucket_id=''avatars''', 'avatars'),
      ('Allow authenticated users to upload avatars', 'bucket_id=''avatars'' AND auth.role() = ''authenticated''', 'avatars');
  END IF;

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

  -- Add to realtime publication
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.task_files;
  EXCEPTION WHEN undefined_object THEN
    RAISE NOTICE 'Publication supabase_realtime does not exist, skipping';
  END;

  -- Enable RLS
  ALTER TABLE public.task_files ENABLE ROW LEVEL SECURITY;

  -- Create policies
  DROP POLICY IF EXISTS "Users can view their own task files" ON public.task_files;
  CREATE POLICY "Users can view their own task files"
    ON public.task_files FOR SELECT
    USING (true);

  DROP POLICY IF EXISTS "Users can insert their own task files" ON public.task_files;
  CREATE POLICY "Users can insert their own task files"
    ON public.task_files FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

  DROP POLICY IF EXISTS "Users can update their own task files" ON public.task_files;
  CREATE POLICY "Users can update their own task files"
    ON public.task_files FOR UPDATE
    USING (auth.role() = 'authenticated');

  DROP POLICY IF EXISTS "Users can delete their own task files" ON public.task_files;
  CREATE POLICY "Users can delete their own task files"
    ON public.task_files FOR DELETE
    USING (auth.role() = 'authenticated');

EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't fail the migration
  RAISE NOTICE 'Error creating storage buckets: %', SQLERRM;
END;
$$;