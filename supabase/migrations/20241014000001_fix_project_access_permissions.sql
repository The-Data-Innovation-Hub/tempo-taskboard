-- Fix project access permissions to ensure users can access their project boards

-- Ensure user_projects table exists with proper structure
CREATE TABLE IF NOT EXISTS user_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, project_id)
);

-- Disable RLS on user_projects table
ALTER TABLE IF EXISTS user_projects DISABLE ROW LEVEL SECURITY;

-- Enable realtime for user_projects table
alter publication supabase_realtime add table user_projects;

-- Ensure project creator is automatically added as a member
CREATE OR REPLACE FUNCTION add_project_creator_to_user_projects()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_projects (user_id, project_id, role)
  VALUES (NEW.user_id, NEW.id, 'owner')
  ON CONFLICT (user_id, project_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to add project creator as member
DROP TRIGGER IF EXISTS add_project_creator_trigger ON projects;
CREATE TRIGGER add_project_creator_trigger
AFTER INSERT ON projects
FOR EACH ROW
EXECUTE FUNCTION add_project_creator_to_user_projects();

-- Add missing user_projects entries for existing projects
INSERT INTO user_projects (user_id, project_id, role)
SELECT user_id, id, 'owner'
FROM projects
WHERE user_id IS NOT NULL
ON CONFLICT (user_id, project_id) DO NOTHING;
