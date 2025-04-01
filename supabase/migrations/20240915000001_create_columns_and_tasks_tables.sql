-- Create columns table
CREATE TABLE IF NOT EXISTS columns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  column_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  column_id UUID NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS on columns
ALTER TABLE columns ENABLE ROW LEVEL SECURITY;

-- Enable RLS on tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for columns
CREATE POLICY "Columns are viewable by everyone" 
ON columns FOR SELECT USING (true);

CREATE POLICY "Columns are insertable by authenticated users" 
ON columns FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Columns are updatable by authenticated users" 
ON columns FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Columns are deletable by authenticated users" 
ON columns FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create policies for tasks
CREATE POLICY "Tasks are viewable by everyone" 
ON tasks FOR SELECT USING (true);

CREATE POLICY "Tasks are insertable by authenticated users" 
ON tasks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Tasks are updatable by authenticated users" 
ON tasks FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Tasks are deletable by authenticated users" 
ON tasks FOR DELETE USING (auth.uid() IS NOT NULL);

-- Enable realtime for columns and tasks
ALTER PUBLICATION supabase_realtime ADD TABLE columns;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;