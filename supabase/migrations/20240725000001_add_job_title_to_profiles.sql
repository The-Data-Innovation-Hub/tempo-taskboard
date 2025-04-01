-- Add job_title column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS job_title TEXT;

-- Create organization_members view for easier querying
CREATE OR REPLACE VIEW organization_members AS
SELECT 
  p.id,
  p.name,
  p.email,
  p.role,
  p.job_title,
  p.avatar,
  p.created_at,
  p.organization_id
FROM profiles p
WHERE p.organization_id IS NOT NULL;

-- Enable realtime for the new view
ALTER PUBLICATION supabase_realtime ADD TABLE organization_members;
