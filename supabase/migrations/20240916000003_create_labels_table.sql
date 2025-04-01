-- Create labels table if it doesn't exist
CREATE TABLE IF NOT EXISTS labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task_labels table if it doesn't exist
CREATE TABLE IF NOT EXISTS task_labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, label_id)
);

-- Create task_assignees table if it doesn't exist
CREATE TABLE IF NOT EXISTS task_assignees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, user_id)
);

-- Enable RLS on labels
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;

-- Enable RLS on task_labels
ALTER TABLE task_labels ENABLE ROW LEVEL SECURITY;

-- Enable RLS on task_assignees
ALTER TABLE task_assignees ENABLE ROW LEVEL SECURITY;

-- Create policies for labels
CREATE POLICY "Labels are viewable by everyone" 
ON labels FOR SELECT USING (true);

CREATE POLICY "Labels are insertable by authenticated users" 
ON labels FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Labels are updatable by authenticated users" 
ON labels FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Labels are deletable by authenticated users" 
ON labels FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create policies for task_labels
CREATE POLICY "Task labels are viewable by everyone" 
ON task_labels FOR SELECT USING (true);

CREATE POLICY "Task labels are insertable by authenticated users" 
ON task_labels FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Task labels are updatable by authenticated users" 
ON task_labels FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Task labels are deletable by authenticated users" 
ON task_labels FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create policies for task_assignees
CREATE POLICY "Task assignees are viewable by everyone" 
ON task_assignees FOR SELECT USING (true);

CREATE POLICY "Task assignees are insertable by authenticated users" 
ON task_assignees FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Task assignees are updatable by authenticated users" 
ON task_assignees FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Task assignees are deletable by authenticated users" 
ON task_assignees FOR DELETE USING (auth.uid() IS NOT NULL);

-- Enable realtime for labels, task_labels, and task_assignees
ALTER PUBLICATION supabase_realtime ADD TABLE labels;
ALTER PUBLICATION supabase_realtime ADD TABLE task_labels;
ALTER PUBLICATION supabase_realtime ADD TABLE task_assignees;