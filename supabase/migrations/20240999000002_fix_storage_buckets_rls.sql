-- First, let's create the buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
SELECT 'task_files', 'task_files', true
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'task_files');

INSERT INTO storage.buckets (id, name, public)
SELECT 'avatars', 'avatars', true
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars');

-- Now let's fix the RLS policies for these buckets
-- First, drop any existing policies
DROP POLICY IF EXISTS "Public access to task_files" ON storage.objects;
DROP POLICY IF EXISTS "Public access to avatars" ON storage.objects;

-- Create policies that allow public access to these buckets
CREATE POLICY "Public access to task_files"
ON storage.objects FOR ALL
USING (bucket_id = 'task_files');

CREATE POLICY "Public access to avatars"
ON storage.objects FOR ALL
USING (bucket_id = 'avatars');

-- Enable RLS on the objects table if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Make sure the buckets table has RLS enabled and has appropriate policies
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies on buckets
DROP POLICY IF EXISTS "Public access to buckets" ON storage.buckets;

-- Create a policy that allows public access to all buckets
CREATE POLICY "Public access to buckets"
ON storage.buckets FOR ALL
USING (true);
