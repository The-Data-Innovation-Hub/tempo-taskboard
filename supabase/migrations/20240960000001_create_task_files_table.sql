-- Create task_files table to store file references
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

-- Enable row level security
ALTER TABLE task_files ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
DROP POLICY IF EXISTS "Users can perform all operations on their task files" ON task_files;
CREATE POLICY "Users can perform all operations on their task files"
ON task_files FOR ALL
USING (true);

-- Add realtime
alter publication supabase_realtime add table task_files;