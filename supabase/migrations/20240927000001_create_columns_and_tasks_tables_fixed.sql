-- Create columns table if it doesn't exist
CREATE TABLE IF NOT EXISTS columns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tasks table if it doesn't exist
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  column_id UUID NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL DEFAULT 0,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on columns
ALTER TABLE columns ENABLE ROW LEVEL SECURITY;

-- Enable RLS on tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for columns
DROP POLICY IF EXISTS "Users can view their project columns" ON columns;
CREATE POLICY "Users can view their project columns"
  ON columns
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their project columns" ON columns;
CREATE POLICY "Users can insert their project columns"
  ON columns
  FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their project columns" ON columns;
CREATE POLICY "Users can update their project columns"
  ON columns
  FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their project columns" ON columns;
CREATE POLICY "Users can delete their project columns"
  ON columns
  FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Create policies for tasks
DROP POLICY IF EXISTS "Users can view their project tasks" ON tasks;
CREATE POLICY "Users can view their project tasks"
  ON tasks
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their project tasks" ON tasks;
CREATE POLICY "Users can insert their project tasks"
  ON tasks
  FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their project tasks" ON tasks;
CREATE POLICY "Users can update their project tasks"
  ON tasks
  FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their project tasks" ON tasks;
CREATE POLICY "Users can delete their project tasks"
  ON tasks
  FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Note: Removed the ALTER PUBLICATION statements that were causing errors
-- since the publication is already set to FOR ALL TABLES
