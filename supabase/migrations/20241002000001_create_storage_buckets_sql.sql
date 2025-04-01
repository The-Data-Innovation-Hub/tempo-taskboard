-- Create task_files bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('task_files', 'task_files', true, 10485760, '{"image/*","application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/vnd.ms-excel","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","application/vnd.ms-powerpoint","application/vnd.openxmlformats-officedocument.presentationml.presentation","text/plain","text/csv","application/json","application/zip","application/x-rar-compressed"}')
ON CONFLICT (id) DO NOTHING;

-- Create avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, '{"image/*"}')
ON CONFLICT (id) DO NOTHING;

-- Create policies for task_files bucket
DROP POLICY IF EXISTS "Public read access" ON storage.objects FOR SELECT;
CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('task_files', 'avatars'));

DROP POLICY IF EXISTS "Task files insert policy" ON storage.objects FOR INSERT;
CREATE POLICY "Task files insert policy"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id IN ('task_files', 'avatars'));

DROP POLICY IF EXISTS "Task files update policy" ON storage.objects FOR UPDATE;
CREATE POLICY "Task files update policy"
  ON storage.objects FOR UPDATE
  USING (bucket_id IN ('task_files', 'avatars'));

DROP POLICY IF EXISTS "Task files delete policy" ON storage.objects FOR DELETE;
CREATE POLICY "Task files delete policy"
  ON storage.objects FOR DELETE
  USING (bucket_id IN ('task_files', 'avatars'));

-- Enable RLS on objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
