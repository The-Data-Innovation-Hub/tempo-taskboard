-- Enable RLS on tasks table
ALTER TABLE IF EXISTS tasks ENABLE ROW LEVEL SECURITY;

-- Create policy for tasks table
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
CREATE POLICY "Users can view their own tasks"
ON tasks
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM projects p
    JOIN user_projects up ON p.id = up.project_id
    WHERE tasks.project_id = p.id AND up.user_id = auth.uid()
  )
);

-- Enable RLS on task_labels table
ALTER TABLE IF EXISTS task_labels ENABLE ROW LEVEL SECURITY;

-- Create policy for task_labels table
DROP POLICY IF EXISTS "Users can view their own task labels" ON task_labels;
CREATE POLICY "Users can view their own task labels"
ON task_labels
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN projects p ON t.project_id = p.id
    JOIN user_projects up ON p.id = up.project_id
    WHERE task_labels.task_id = t.id AND up.user_id = auth.uid()
  )
);

-- Enable RLS on task_assignees table
ALTER TABLE IF EXISTS task_assignees ENABLE ROW LEVEL SECURITY;

-- Create policy for task_assignees table
DROP POLICY IF EXISTS "Users can view their own task assignees" ON task_assignees;
CREATE POLICY "Users can view their own task assignees"
ON task_assignees
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN projects p ON t.project_id = p.id
    JOIN user_projects up ON p.id = up.project_id
    WHERE task_assignees.task_id = t.id AND up.user_id = auth.uid()
  )
);

-- Enable realtime for these tables
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table task_labels;
alter publication supabase_realtime add table task_assignees;