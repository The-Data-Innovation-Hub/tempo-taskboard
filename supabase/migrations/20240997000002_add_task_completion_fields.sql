-- Add is_completed and completed_at columns to tasks table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='is_completed') THEN
        ALTER TABLE tasks ADD COLUMN is_completed BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='completed_at') THEN
        ALTER TABLE tasks ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
    END IF;
END $$;