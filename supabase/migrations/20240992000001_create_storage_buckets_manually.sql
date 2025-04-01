-- Create required storage buckets if they don't exist

-- Create the task_files bucket
DO $$
BEGIN
    BEGIN
        EXECUTE 'CREATE BUCKET IF NOT EXISTS "task_files" WITH (public = true);';
        RAISE NOTICE 'Created task_files bucket';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error creating task_files bucket: %', SQLERRM;
    END;

    BEGIN
        EXECUTE 'CREATE BUCKET IF NOT EXISTS "avatars" WITH (public = true);';
        RAISE NOTICE 'Created avatars bucket';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error creating avatars bucket: %', SQLERRM;
    END;
END$$;

-- Add storage policies for task_files bucket
BEGIN
    BEGIN
        DROP POLICY IF EXISTS "Anyone can read task_files" ON storage.objects;
        CREATE POLICY "Anyone can read task_files"
          ON storage.objects FOR SELECT
          USING (bucket_id = 'task_files');
        RAISE NOTICE 'Created task_files read policy';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error creating task_files read policy: %', SQLERRM;
    END;

    BEGIN
        DROP POLICY IF EXISTS "Authenticated users can upload task_files" ON storage.objects;
        CREATE POLICY "Authenticated users can upload task_files"
          ON storage.objects FOR INSERT
          WITH CHECK (bucket_id = 'task_files' AND auth.role() = 'authenticated');
        RAISE NOTICE 'Created task_files upload policy';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error creating task_files upload policy: %', SQLERRM;
    END;
END;

-- Add storage policies for avatars bucket
BEGIN
    BEGIN
        DROP POLICY IF EXISTS "Anyone can read avatars" ON storage.objects;
        CREATE POLICY "Anyone can read avatars"
          ON storage.objects FOR SELECT
          USING (bucket_id = 'avatars');
        RAISE NOTICE 'Created avatars read policy';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error creating avatars read policy: %', SQLERRM;
    END;

    BEGIN
        DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
        CREATE POLICY "Authenticated users can upload avatars"
          ON storage.objects FOR INSERT
          WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
        RAISE NOTICE 'Created avatars upload policy';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error creating avatars upload policy: %', SQLERRM;
    END;
END;
