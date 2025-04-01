-- Disable RLS for columns table to allow creation of default columns
ALTER TABLE columns DISABLE ROW LEVEL SECURITY;

-- Create policy for columns table
DROP POLICY IF EXISTS "Users can view their project columns" ON columns;
CREATE POLICY "Users can view their project columns"
  ON columns
  FOR ALL
  USING (
    project_id IN (
      SELECT project_id FROM user_projects WHERE user_id = auth.uid()
    ) OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Enable realtime for columns table
ALTER PUBLICATION supabase_realtime ADD TABLE columns;
