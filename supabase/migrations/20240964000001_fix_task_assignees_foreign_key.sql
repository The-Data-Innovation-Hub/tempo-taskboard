-- Fix the foreign key relationship between task_assignees and profiles

-- First, check if the task_assignees table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'task_assignees') THEN
    -- Drop existing table if it exists
    DROP TABLE IF EXISTS task_assignees;
    
    -- Recreate the table with proper foreign key constraints
    CREATE TABLE IF NOT EXISTS task_assignees (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      UNIQUE(task_id, user_id)
    );
    
    -- Enable RLS
    ALTER TABLE task_assignees ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    DROP POLICY IF EXISTS "Users can view task assignees" ON task_assignees;
    CREATE POLICY "Users can view task assignees"
    ON task_assignees FOR SELECT
    USING (true);
    
    DROP POLICY IF EXISTS "Users can insert task assignees" ON task_assignees;
    CREATE POLICY "Users can insert task assignees"
    ON task_assignees FOR INSERT
    WITH CHECK (true);
    
    DROP POLICY IF EXISTS "Users can update task assignees" ON task_assignees;
    CREATE POLICY "Users can update task assignees"
    ON task_assignees FOR UPDATE
    USING (true);
    
    DROP POLICY IF EXISTS "Users can delete task assignees" ON task_assignees;
    CREATE POLICY "Users can delete task assignees"
    ON task_assignees FOR DELETE
    USING (true);
  END IF;
END
$$;