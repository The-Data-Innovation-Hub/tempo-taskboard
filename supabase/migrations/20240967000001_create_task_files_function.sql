-- Create the task_files table if it doesn't exist
CREATE OR REPLACE FUNCTION create_task_files_table_if_not_exists()
RETURNS void AS $$
BEGIN
  -- Check if the task_files table exists
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'task_files') THEN
    -- Create the task_files table
    CREATE TABLE public.task_files (
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
    CREATE POLICY "Allow full access to all users"
      ON public.task_files
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);

    -- Create policy for public access to files
    CREATE POLICY "Allow public read access"
      ON public.task_files
      FOR SELECT
      TO anon
      USING (true);
  END IF;
END;
$$ LANGUAGE plpgsql;
