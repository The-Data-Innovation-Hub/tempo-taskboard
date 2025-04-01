-- Create a storage bucket for task files if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('task_files', 'Task Files', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to the task_files bucket
DROP POLICY IF EXISTS "Public access" ON storage.objects;
CREATE POLICY "Public access"
ON storage.objects FOR SELECT
USING (bucket_id = 'task_files');

-- Allow authenticated users to upload files
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'task_files');

-- Allow users to delete their own files
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'task_files');
