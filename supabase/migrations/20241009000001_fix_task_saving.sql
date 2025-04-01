-- Create a permissive RLS policy for tasks table
DROP POLICY IF EXISTS "Allow all operations on tasks" ON tasks;
CREATE POLICY "Allow all operations on tasks"
ON tasks
USING (true)
WITH CHECK (true);

-- Make sure realtime is enabled for tasks table
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;

-- Create a permissive RLS policy for task_labels table if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_labels') THEN
        DROP POLICY IF EXISTS "Allow all operations on task_labels" ON task_labels;
        CREATE POLICY "Allow all operations on task_labels"
        ON task_labels
        USING (true)
        WITH CHECK (true);
        
        ALTER PUBLICATION supabase_realtime ADD TABLE task_labels;
    END IF;
END $$;

-- Create a permissive RLS policy for task_assignees table if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_assignees') THEN
        DROP POLICY IF EXISTS "Allow all operations on task_assignees" ON task_assignees;
        CREATE POLICY "Allow all operations on task_assignees"
        ON task_assignees
        USING (true)
        WITH CHECK (true);
        
        ALTER PUBLICATION supabase_realtime ADD TABLE task_assignees;
    END IF;
END $$;
