-- Create the task_files table if it doesn't exist
CREATE TABLE IF NOT EXISTS task_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable row level security
ALTER TABLE task_files ENABLE ROW LEVEL SECURITY;

-- Create RPC function to create task_files table if it doesn't exist
CREATE OR REPLACE FUNCTION create_task_files_table_if_not_exists()
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'task_files') THEN
    CREATE TABLE public.task_files (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      file_type TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    ALTER TABLE public.task_files ENABLE ROW LEVEL SECURITY;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create policies for task_files table
DROP POLICY IF EXISTS "Users can view their own task files" ON task_files;
CREATE POLICY "Users can view their own task files"
  ON task_files
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN columns ON tasks.column_id = columns.id
      JOIN projects ON columns.project_id = projects.id
      JOIN user_projects ON projects.id = user_projects.project_id
      WHERE tasks.id = task_files.task_id
      AND user_projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own task files" ON task_files;
CREATE POLICY "Users can insert their own task files"
  ON task_files
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN columns ON tasks.column_id = columns.id
      JOIN projects ON columns.project_id = projects.id
      JOIN user_projects ON projects.id = user_projects.project_id
      WHERE tasks.id = task_files.task_id
      AND user_projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own task files" ON task_files;
CREATE POLICY "Users can update their own task files"
  ON task_files
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN columns ON tasks.column_id = columns.id
      JOIN projects ON columns.project_id = projects.id
      JOIN user_projects ON projects.id = user_projects.project_id
      WHERE tasks.id = task_files.task_id
      AND user_projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their own task files" ON task_files;
CREATE POLICY "Users can delete their own task files"
  ON task_files
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN columns ON tasks.column_id = columns.id
      JOIN projects ON columns.project_id = projects.id
      JOIN user_projects ON projects.id = user_projects.project_id
      WHERE tasks.id = task_files.task_id
      AND user_projects.user_id = auth.uid()
    )
  );

-- Enable realtime for task_files table
ALTER PUBLICATION supabase_realtime ADD TABLE task_files;