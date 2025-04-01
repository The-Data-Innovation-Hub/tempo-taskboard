-- Add attachments column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- Enable realtime for tasks table
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
