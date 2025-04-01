-- Create task_files table if it doesn't exist
CREATE TABLE IF NOT EXISTS task_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE task_files;

-- Enable RLS
ALTER TABLE task_files ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view their own task files" ON task_files;
CREATE POLICY "Users can view their own task files"
  ON task_files FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = task_files.task_id
    AND tasks.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can insert their own task files" ON task_files;
CREATE POLICY "Users can insert their own task files"
  ON task_files FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = task_files.task_id
    AND tasks.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can update their own task files" ON task_files;
CREATE POLICY "Users can update their own task files"
  ON task_files FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = task_files.task_id
    AND tasks.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can delete their own task files" ON task_files;
CREATE POLICY "Users can delete their own task files"
  ON task_files FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = task_files.task_id
    AND tasks.user_id = auth.uid()
  ));

-- Create function to check if task_files table exists
CREATE OR REPLACE FUNCTION create_task_files_table_if_not_exists()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- This function is just a placeholder since we now create the table directly in the migration
  RAISE NOTICE 'Task files table should already exist from migration';
END;
$$;