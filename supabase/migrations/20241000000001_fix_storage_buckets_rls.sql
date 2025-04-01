-- Disable RLS for storage.buckets to allow bucket creation
ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;

-- Create the task_files bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
SELECT 'task_files', 'task_files', true, false, 52428800, ARRAY[
  'image/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/json',
  'application/zip',
  'application/x-rar-compressed'
]::text[]
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'task_files');

-- Create the avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
SELECT 'avatars', 'avatars', true, false, 5242880, ARRAY['image/*']::text[]
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'avatars');

-- Disable RLS for storage.objects to allow file operations
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Add realtime publication for buckets
ALTER PUBLICATION supabase_realtime ADD TABLE storage.buckets;
ALTER PUBLICATION supabase_realtime ADD TABLE storage.objects;

-- Create public access policies for task_files bucket
DROP POLICY IF EXISTS "Public access" ON storage.objects;
CREATE POLICY "Public access" ON storage.objects
  FOR ALL
  USING (bucket_id = 'task_files' OR bucket_id = 'avatars');

-- Create public access policies for buckets
DROP POLICY IF EXISTS "Public buckets are viewable" ON storage.buckets;
CREATE POLICY "Public buckets are viewable" ON storage.buckets
  FOR SELECT
  USING (public = true);
