-- Create task_files table if it doesn't exist
CREATE TABLE IF NOT EXISTS task_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  file_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable row level security
ALTER TABLE task_files ENABLE ROW LEVEL SECURITY;

-- Create policies for task_files
DROP POLICY IF EXISTS "Users can view task files they have access to" ON task_files;
CREATE POLICY "Users can view task files they have access to"
ON task_files FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN columns c ON t.column_id = c.id
    JOIN projects p ON c.project_id = p.id
    JOIN user_projects up ON p.id = up.project_id
    WHERE task_files.task_id = t.id AND up.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can insert task files for tasks they have access to" ON task_files;
CREATE POLICY "Users can insert task files for tasks they have access to"
ON task_files FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN columns c ON t.column_id = c.id
    JOIN projects p ON c.project_id = p.id
    JOIN user_projects up ON p.id = up.project_id
    WHERE task_files.task_id = t.id AND up.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update task files they have access to" ON task_files;
CREATE POLICY "Users can update task files they have access to"
ON task_files FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN columns c ON t.column_id = c.id
    JOIN projects p ON c.project_id = p.id
    JOIN user_projects up ON p.id = up.project_id
    WHERE task_files.task_id = t.id AND up.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete task files they have access to" ON task_files;
CREATE POLICY "Users can delete task files they have access to"
ON task_files FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN columns c ON t.column_id = c.id
    JOIN projects p ON c.project_id = p.id
    JOIN user_projects up ON p.id = up.project_id
    WHERE task_files.task_id = t.id AND up.user_id = auth.uid()
  )
);

-- Enable realtime for task_files
ALTER PUBLICATION supabase_realtime ADD TABLE task_files;

-- Create function to check if task_files table exists
CREATE OR REPLACE FUNCTION create_task_files_table_if_not_exists()
RETURNS VOID AS $$
BEGIN
  -- Function body is empty as the table is created by the migration
END;
$$ LANGUAGE plpgsql;
