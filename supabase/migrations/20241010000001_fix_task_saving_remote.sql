-- Enable RLS on tasks table but with permissive policies
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policy for tasks table that allows all operations for authenticated users
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON tasks;
CREATE POLICY "Allow all operations for authenticated users"
ON tasks
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Enable RLS on task_labels table but with permissive policies
ALTER TABLE task_labels ENABLE ROW LEVEL SECURITY;

-- Create policy for task_labels table that allows all operations for authenticated users
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON task_labels;
CREATE POLICY "Allow all operations for authenticated users"
ON task_labels
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Enable RLS on task_assignees table but with permissive policies
ALTER TABLE task_assignees ENABLE ROW LEVEL SECURITY;

-- Create policy for task_assignees table that allows all operations for authenticated users
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON task_assignees;
CREATE POLICY "Allow all operations for authenticated users"
ON task_assignees
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Enable realtime for tasks table
alter publication supabase_realtime add table tasks;

-- Enable realtime for task_labels table
alter publication supabase_realtime add table task_labels;

-- Enable realtime for task_assignees table
alter publication supabase_realtime add table task_assignees;