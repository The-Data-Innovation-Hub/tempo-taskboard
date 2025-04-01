-- Check if avatar column exists in profiles table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar') THEN
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar TEXT;
    END IF;
END $$;

-- Enable storage for user avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policy to allow authenticated users to upload their own avatars
DROP POLICY IF EXISTS "Avatar storage policy" ON storage.objects;
CREATE POLICY "Avatar storage policy"
ON storage.objects FOR ALL
USING (bucket_id = 'avatars' AND (auth.uid() = owner OR bucket_id = 'avatars' AND auth.role() = 'authenticated'))
WITH CHECK (bucket_id = 'avatars' AND (auth.uid() = owner OR bucket_id = 'avatars' AND auth.role() = 'authenticated'));

-- Enable realtime for profiles table
alter publication supabase_realtime add table profiles;
