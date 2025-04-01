-- Create the task_files storage bucket if it doesn't exist
DO $$
BEGIN
    -- Check if the bucket exists
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE name = 'task_files'
    ) THEN
        -- Create the bucket
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('task_files', 'task_files', true);
        
        -- Enable public access to the bucket
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES ('task_files', 'task_files', true, 10485760, '{image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/csv,application/json,application/zip,application/x-rar-compressed}')
        ON CONFLICT (id) DO UPDATE
        SET public = true,
            file_size_limit = 10485760,
            allowed_mime_types = '{image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/csv,application/json,application/zip,application/x-rar-compressed}';
    END IF;
END $$;

-- Create RLS policies for the task_files bucket
CREATE POLICY "Allow public read access" ON storage.objects
    FOR SELECT USING (bucket_id = 'task_files');

CREATE POLICY "Allow authenticated users to upload files" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'task_files' AND auth.role() = 'authenticated');

CREATE POLICY "Allow users to update their own files" ON storage.objects
    FOR UPDATE USING (bucket_id = 'task_files' AND auth.uid() = owner);

CREATE POLICY "Allow users to delete their own files" ON storage.objects
    FOR DELETE USING (bucket_id = 'task_files' AND auth.uid() = owner);

-- Create the task_files table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.task_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'task_files_task_id_fkey' 
        AND table_name = 'task_files'
    ) THEN
        ALTER TABLE public.task_files 
        ADD CONSTRAINT task_files_task_id_fkey 
        FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;
    END IF;
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'tasks table does not exist yet, skipping foreign key constraint';
END $$;

-- Create RLS policies for the task_files table
ALTER TABLE public.task_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to select task files" ON public.task_files
    FOR SELECT USING (true);

CREATE POLICY "Allow users to insert task files" ON public.task_files
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow users to update their own task files" ON public.task_files
    FOR UPDATE USING (true);

CREATE POLICY "Allow users to delete their own task files" ON public.task_files
    FOR DELETE USING (true);

-- Add the task_files table to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_files;
