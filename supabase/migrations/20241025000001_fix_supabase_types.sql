-- This migration fixes the Supabase types and adds missing functions

-- Create a function to check if storage is properly configured
CREATE OR REPLACE FUNCTION check_storage_setup()
RETURNS BOOLEAN AS $$
DECLARE
  bucket_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'avatars'
  ) INTO bucket_exists;
  
  RETURN bucket_exists;
END;
$$ LANGUAGE plpgsql;

-- Create a function to check if the count function is available
CREATE OR REPLACE FUNCTION count_records(table_name TEXT)
RETURNS INTEGER AS $$
DECLARE
  count_result INTEGER;
BEGIN
  EXECUTE format('SELECT COUNT(*) FROM %I', table_name) INTO count_result;
  RETURN count_result;
END;
$$ LANGUAGE plpgsql;

-- Ensure the storage buckets exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'avatars') THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'task-files') THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('task-files', 'task-files', true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'organization-logos') THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('organization-logos', 'organization-logos', true);
  END IF;
END;
$$;

-- Add storage policies if they don't exist
DO $$
BEGIN
  -- Avatars bucket policies
  IF NOT EXISTS (SELECT 1 FROM storage.policies WHERE bucket_id = 'avatars' AND name = 'Avatar Public Read') THEN
    INSERT INTO storage.policies (bucket_id, name, permission, definition)
    VALUES ('avatars', 'Avatar Public Read', 'SELECT', '{"bucket_id":"avatars"}');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM storage.policies WHERE bucket_id = 'avatars' AND name = 'Avatar Authenticated Insert') THEN
    INSERT INTO storage.policies (bucket_id, name, permission, definition)
    VALUES ('avatars', 'Avatar Authenticated Insert', 'INSERT', '{"bucket_id":"avatars","auth.role":"authenticated"}');
  END IF;
  
  -- Task files bucket policies
  IF NOT EXISTS (SELECT 1 FROM storage.policies WHERE bucket_id = 'task-files' AND name = 'Task Files Public Read') THEN
    INSERT INTO storage.policies (bucket_id, name, permission, definition)
    VALUES ('task-files', 'Task Files Public Read', 'SELECT', '{"bucket_id":"task-files"}');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM storage.policies WHERE bucket_id = 'task-files' AND name = 'Task Files Authenticated Insert') THEN
    INSERT INTO storage.policies (bucket_id, name, permission, definition)
    VALUES ('task-files', 'Task Files Authenticated Insert', 'INSERT', '{"bucket_id":"task-files","auth.role":"authenticated"}');
  END IF;
  
  -- Organization logos bucket policies
  IF NOT EXISTS (SELECT 1 FROM storage.policies WHERE bucket_id = 'organization-logos' AND name = 'Organization Logos Public Read') THEN
    INSERT INTO storage.policies (bucket_id, name, permission, definition)
    VALUES ('organization-logos', 'Organization Logos Public Read', 'SELECT', '{"bucket_id":"organization-logos"}');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM storage.policies WHERE bucket_id = 'organization-logos' AND name = 'Organization Logos Authenticated Insert') THEN
    INSERT INTO storage.policies (bucket_id, name, permission, definition)
    VALUES ('organization-logos', 'Organization Logos Authenticated Insert', 'INSERT', '{"bucket_id":"organization-logos","auth.role":"authenticated"}');
  END IF;
END;
$$;

-- Add attachments column to tasks table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tasks' 
    AND column_name = 'attachments'
  ) THEN
    ALTER TABLE public.tasks ADD COLUMN attachments JSONB;
  END IF;
END;
$$;
