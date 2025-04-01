-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can insert columns for their projects" ON columns;

-- Create a more permissive policy for columns
CREATE POLICY "Users can insert columns for their projects"
ON columns
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow if the user is the creator of the project
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_id AND projects.user_id = auth.uid()
  )
  -- Or if the user is a member of the project
  OR EXISTS (
    SELECT 1 FROM user_projects 
    WHERE user_projects.project_id = project_id AND user_projects.user_id = auth.uid()
  )
  -- Or if the user is explicitly set as the column creator
  OR user_id = auth.uid()
);

-- Ensure there's a policy for selecting columns
DROP POLICY IF EXISTS "Users can view columns for their projects" ON columns;
CREATE POLICY "Users can view columns for their projects"
ON columns
FOR SELECT
TO authenticated
USING (
  -- Allow if the user is the creator of the project
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_id AND projects.user_id = auth.uid()
  )
  -- Or if the user is a member of the project
  OR EXISTS (
    SELECT 1 FROM user_projects 
    WHERE user_projects.project_id = project_id AND user_projects.user_id = auth.uid()
  )
  -- Or if the user is explicitly set as the column creator
  OR user_id = auth.uid()
);

-- Ensure there's a policy for updating columns
DROP POLICY IF EXISTS "Users can update columns for their projects" ON columns;
CREATE POLICY "Users can update columns for their projects"
ON columns
FOR UPDATE
TO authenticated
USING (
  -- Allow if the user is the creator of the project
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_id AND projects.user_id = auth.uid()
  )
  -- Or if the user is a member of the project
  OR EXISTS (
    SELECT 1 FROM user_projects 
    WHERE user_projects.project_id = project_id AND user_projects.user_id = auth.uid()
  )
  -- Or if the user is explicitly set as the column creator
  OR user_id = auth.uid()
);

-- Ensure there's a policy for deleting columns
DROP POLICY IF EXISTS "Users can delete columns for their projects" ON columns;
CREATE POLICY "Users can delete columns for their projects"
ON columns
FOR DELETE
TO authenticated
USING (
  -- Allow if the user is the creator of the project
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_id AND projects.user_id = auth.uid()
  )
  -- Or if the user is a member of the project
  OR EXISTS (
    SELECT 1 FROM user_projects 
    WHERE user_projects.project_id = project_id AND user_projects.user_id = auth.uid()
  )
  -- Or if the user is explicitly set as the column creator
  OR user_id = auth.uid()
);

-- Make sure the columns table has realtime enabled
alter publication supabase_realtime add table columns;
