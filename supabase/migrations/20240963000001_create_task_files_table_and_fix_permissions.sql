-- Create task_files table if it doesn't exist
CREATE TABLE IF NOT EXISTS task_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create task_files bucket if it doesn't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('task_files', 'task_files', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Enable RLS on task_files table
ALTER TABLE task_files ENABLE ROW LEVEL SECURITY;

-- Create policies for task_files table
DROP POLICY IF EXISTS "Users can view task files" ON task_files;
CREATE POLICY "Users can view task files"
ON task_files FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can insert task files" ON task_files;
CREATE POLICY "Users can insert task files"
ON task_files FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update task files" ON task_files;
CREATE POLICY "Users can update task files"
ON task_files FOR UPDATE
USING (true);

DROP POLICY IF EXISTS "Users can delete task files" ON task_files;
CREATE POLICY "Users can delete task files"
ON task_files FOR DELETE
USING (true);

-- Create storage policy for task_files bucket
BEGIN;
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Public Access" ON storage.objects;
  DROP POLICY IF EXISTS "Individual Access" ON storage.objects;
  DROP POLICY IF EXISTS "Task Files Access" ON storage.objects;

  -- Create new policies
  CREATE POLICY "Task Files Access"
  ON storage.objects FOR ALL
  USING (bucket_id = 'task_files')
  WITH CHECK (bucket_id = 'task_files');
COMMIT;

-- Note: We're not adding to supabase_realtime publication since it's FOR ALL TABLES
