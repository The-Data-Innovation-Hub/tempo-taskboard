-- First, make sure RLS is enabled for the columns table
ALTER TABLE columns ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow all operations on columns" ON columns;

-- Create a policy that allows authenticated users to select any column
CREATE POLICY "Users can view any column"
  ON columns FOR SELECT
  USING (true);

-- Create a policy that allows authenticated users to insert columns for projects they have access to
CREATE POLICY "Users can insert columns for their projects"
  ON columns FOR INSERT
  WITH CHECK (
    -- Allow if the user is the project owner
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
    OR
    -- Allow if the user is a member of the project
    project_id IN (
      SELECT project_id FROM user_projects WHERE user_id = auth.uid()
    )
    OR
    -- Allow if the user is an admin
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create a policy that allows authenticated users to update columns for projects they have access to
CREATE POLICY "Users can update columns for their projects"
  ON columns FOR UPDATE
  USING (
    -- Allow if the user is the project owner
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
    OR
    -- Allow if the user is a member of the project
    project_id IN (
      SELECT project_id FROM user_projects WHERE user_id = auth.uid()
    )
    OR
    -- Allow if the user is an admin
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create a policy that allows authenticated users to delete columns for projects they have access to
CREATE POLICY "Users can delete columns for their projects"
  ON columns FOR DELETE
  USING (
    -- Allow if the user is the project owner
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
    OR
    -- Allow if the user is a member of the project
    project_id IN (
      SELECT project_id FROM user_projects WHERE user_id = auth.uid()
    )
    OR
    -- Allow if the user is an admin
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Make sure realtime is enabled for the columns table
ALTER PUBLICATION supabase_realtime ADD TABLE columns;
