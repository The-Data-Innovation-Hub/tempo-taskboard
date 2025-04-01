-- Create a storage bucket for user avatars if it doesn't exist already
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Set up a policy to allow authenticated users to upload their own avatars
DROP POLICY IF EXISTS "Allow users to upload their own avatar" ON storage.objects;
CREATE POLICY "Allow users to upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Set up a policy to allow users to update their own avatars
DROP POLICY IF EXISTS "Allow users to update their own avatar" ON storage.objects;
CREATE POLICY "Allow users to update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Set up a policy to allow users to read all avatars
DROP POLICY IF EXISTS "Allow public read access to avatars" ON storage.objects;
CREATE POLICY "Allow public read access to avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
