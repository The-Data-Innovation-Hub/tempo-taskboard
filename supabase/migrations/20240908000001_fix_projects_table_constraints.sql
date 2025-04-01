-- Modify projects table to make organization_id nullable
ALTER TABLE projects ALTER COLUMN organization_id DROP NOT NULL;

-- Ensure RLS is properly configured
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create projects" ON projects;

-- Create more permissive policy for project creation
CREATE POLICY "Users can create projects"
ON projects FOR INSERT
TO authenticated
WITH CHECK (true);
