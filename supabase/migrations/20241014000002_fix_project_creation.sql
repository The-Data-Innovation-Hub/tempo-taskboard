-- Fix project creation to ensure user_id is properly set and creators are added to user_projects

-- Create a function to add project creators to user_projects
CREATE OR REPLACE FUNCTION add_project_creator_to_user_projects()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert the project creator into user_projects table
  INSERT INTO user_projects (user_id, project_id)
  VALUES (NEW.user_id, NEW.id)
  ON CONFLICT (user_id, project_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically add project creators to user_projects
DROP TRIGGER IF EXISTS add_project_creator_trigger ON projects;
CREATE TRIGGER add_project_creator_trigger
AFTER INSERT ON projects
FOR EACH ROW
EXECUTE FUNCTION add_project_creator_to_user_projects();

-- Ensure user_projects table exists with proper structure
CREATE TABLE IF NOT EXISTS user_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

-- Enable row-level security on user_projects
ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;

-- Create policies for user_projects
DROP POLICY IF EXISTS "Users can view their own project associations" ON user_projects;
CREATE POLICY "Users can view their own project associations"
ON user_projects FOR SELECT
USING (auth.uid() = user_id OR auth.uid() IN (
  SELECT user_id FROM profiles WHERE role = 'admin'
));

DROP POLICY IF EXISTS "Users can insert their own project associations" ON user_projects;
CREATE POLICY "Users can insert their own project associations"
ON user_projects FOR INSERT
WITH CHECK (auth.uid() = user_id OR auth.uid() IN (
  SELECT user_id FROM profiles WHERE role = 'admin'
));

DROP POLICY IF EXISTS "Users can delete their own project associations" ON user_projects;
CREATE POLICY "Users can delete their own project associations"
ON user_projects FOR DELETE
USING (auth.uid() = user_id OR auth.uid() IN (
  SELECT user_id FROM profiles WHERE role = 'admin'
));

-- Add missing user_projects entries for existing projects
INSERT INTO user_projects (user_id, project_id)
SELECT user_id, id FROM projects
WHERE NOT EXISTS (
  SELECT 1 FROM user_projects
  WHERE user_projects.user_id = projects.user_id
  AND user_projects.project_id = projects.id
)
ON CONFLICT (user_id, project_id) DO NOTHING;

-- Enable realtime for user_projects
ALTER PUBLICATION supabase_realtime ADD TABLE user_projects;
