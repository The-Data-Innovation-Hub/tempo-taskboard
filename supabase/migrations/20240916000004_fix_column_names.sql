-- Fix column names in API
-- This migration ensures the column names match what the API is expecting

-- Add 'order' column to columns table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'columns' AND column_name = 'order') THEN
        ALTER TABLE columns ADD COLUMN "order" INTEGER;
        UPDATE columns SET "order" = column_order;
    END IF;
END
$$;

-- Add 'order' column to tasks table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'order') THEN
        ALTER TABLE tasks ADD COLUMN "order" INTEGER;
        UPDATE tasks SET "order" = task_order;
    END IF;
END
$$;