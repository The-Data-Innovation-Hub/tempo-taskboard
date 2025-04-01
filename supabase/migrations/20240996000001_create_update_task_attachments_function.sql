-- Create a function to update task attachments
CREATE OR REPLACE FUNCTION update_task_attachments(task_id UUID, attachments_json JSONB)
RETURNS VOID AS $$
BEGIN
  UPDATE tasks
  SET attachments = attachments_json
  WHERE id = task_id;
END;
$$ LANGUAGE plpgsql;

-- Make sure the attachments column exists
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- Enable realtime for tasks table
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
