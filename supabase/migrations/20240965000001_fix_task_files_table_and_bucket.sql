-- Create task_files bucket if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'task_files') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('task_files', 'task_files', true);
  END IF;
END$$;

-- Create task_files table if it doesn't exist
CREATE TABLE IF NOT EXISTS task_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

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

-- Create storage policies for task_files bucket
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'task_files');

DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'task_files');

DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'task_files');

DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;
CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'task_files');
