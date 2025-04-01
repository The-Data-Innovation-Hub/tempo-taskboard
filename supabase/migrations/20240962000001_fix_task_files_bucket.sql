-- Create task_files bucket if it doesn't exist

-- Check if the bucket exists and create it if needed
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'task_files') THEN
    -- Create the bucket
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('task_files', 'task_files', true);
    
    -- Set up public access policies (one by one to avoid errors)
    INSERT INTO storage.policies (name, bucket_id, operation, definition)
    VALUES ('Public Read Access', 'task_files', 'SELECT', 'true');
    
    INSERT INTO storage.policies (name, bucket_id, operation, definition)
    VALUES ('Authenticated Users Can Upload', 'task_files', 'INSERT', 'auth.role() = ''authenticated''');
    
    INSERT INTO storage.policies (name, bucket_id, operation, definition)
    VALUES ('Authenticated Users Can Update Own Files', 'task_files', 'UPDATE', 'auth.role() = ''authenticated''');
    
    INSERT INTO storage.policies (name, bucket_id, operation, definition)
    VALUES ('Authenticated Users Can Delete Own Files', 'task_files', 'DELETE', 'auth.role() = ''authenticated''');
  END IF;
END
$$;