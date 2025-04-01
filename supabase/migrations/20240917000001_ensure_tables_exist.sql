-- Ensure the uuid-ossp extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ensure projects table exists (if it doesn't already)
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  is_favorite BOOLEAN DEFAULT false,
  user_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure organizations table exists (if it doesn't already)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure profiles table exists (if it doesn't already)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT,
  email TEXT,
  avatar TEXT,
  job_title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create columns table
CREATE TABLE IF NOT EXISTS columns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  column_order INTEGER NOT NULL DEFAULT 0,
  "order" INTEGER,
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
  "order" INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create labels table
CREATE TABLE IF NOT EXISTS labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task_labels table
CREATE TABLE IF NOT EXISTS task_labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, label_id)
);

-- Create task_assignees table
CREATE TABLE IF NOT EXISTS task_assignees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, user_id)
);

-- Update columns.order from column_order if null
UPDATE columns SET "order" = column_order WHERE "order" IS NULL;

-- Update tasks.order from task_order if null
UPDATE tasks SET "order" = task_order WHERE "order" IS NULL;

-- Enable RLS on all tables
ALTER TABLE columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignees ENABLE ROW LEVEL SECURITY;

-- Create policies for columns
DROP POLICY IF EXISTS "Columns are viewable by everyone" ON columns;
CREATE POLICY "Columns are viewable by everyone" 
ON columns FOR SELECT USING (true);

DROP POLICY IF EXISTS "Columns are insertable by authenticated users" ON columns;
CREATE POLICY "Columns are insertable by authenticated users" 
ON columns FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Columns are updatable by authenticated users" ON columns;
CREATE POLICY "Columns are updatable by authenticated users" 
ON columns FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Columns are deletable by authenticated users" ON columns;
CREATE POLICY "Columns are deletable by authenticated users" 
ON columns FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create policies for tasks
DROP POLICY IF EXISTS "Tasks are viewable by everyone" ON tasks;
CREATE POLICY "Tasks are viewable by everyone" 
ON tasks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Tasks are insertable by authenticated users" ON tasks;
CREATE POLICY "Tasks are insertable by authenticated users" 
ON tasks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Tasks are updatable by authenticated users" ON tasks;
CREATE POLICY "Tasks are updatable by authenticated users" 
ON tasks FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Tasks are deletable by authenticated users" ON tasks;
CREATE POLICY "Tasks are deletable by authenticated users" 
ON tasks FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create policies for labels
DROP POLICY IF EXISTS "Labels are viewable by everyone" ON labels;
CREATE POLICY "Labels are viewable by everyone" 
ON labels FOR SELECT USING (true);

DROP POLICY IF EXISTS "Labels are insertable by authenticated users" ON labels;
CREATE POLICY "Labels are insertable by authenticated users" 
ON labels FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Labels are updatable by authenticated users" ON labels;
CREATE POLICY "Labels are updatable by authenticated users" 
ON labels FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Labels are deletable by authenticated users" ON labels;
CREATE POLICY "Labels are deletable by authenticated users" 
ON labels FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create policies for task_labels
DROP POLICY IF EXISTS "Task labels are viewable by everyone" ON task_labels;
CREATE POLICY "Task labels are viewable by everyone" 
ON task_labels FOR SELECT USING (true);

DROP POLICY IF EXISTS "Task labels are insertable by authenticated users" ON task_labels;
CREATE POLICY "Task labels are insertable by authenticated users" 
ON task_labels FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Task labels are updatable by authenticated users" ON task_labels;
CREATE POLICY "Task labels are updatable by authenticated users" 
ON task_labels FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Task labels are deletable by authenticated users" ON task_labels;
CREATE POLICY "Task labels are deletable by authenticated users" 
ON task_labels FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create policies for task_assignees
DROP POLICY IF EXISTS "Task assignees are viewable by everyone" ON task_assignees;
CREATE POLICY "Task assignees are viewable by everyone" 
ON task_assignees FOR SELECT USING (true);

DROP POLICY IF EXISTS "Task assignees are insertable by authenticated users" ON task_assignees;
CREATE POLICY "Task assignees are insertable by authenticated users" 
ON task_assignees FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Task assignees are updatable by authenticated users" ON task_assignees;
CREATE POLICY "Task assignees are updatable by authenticated users" 
ON task_assignees FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Task assignees are deletable by authenticated users" ON task_assignees;
CREATE POLICY "Task assignees are deletable by authenticated users" 
ON task_assignees FOR DELETE USING (auth.uid() IS NOT NULL);

-- Realtime is already enabled via FOR ALL TABLES
-- No need to add tables individually to the publication