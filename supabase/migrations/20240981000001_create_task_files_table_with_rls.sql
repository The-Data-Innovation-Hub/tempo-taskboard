-- Create task_files table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.task_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable row level security
ALTER TABLE public.task_files ENABLE ROW LEVEL SECURITY;

-- Create policies for task_files
DROP POLICY IF EXISTS "Users can view their own task files" ON public.task_files;
CREATE POLICY "Users can view their own task files"
  ON public.task_files
  FOR SELECT
  USING (
    task_id IN (
      SELECT id FROM public.tasks WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own task files" ON public.task_files;
CREATE POLICY "Users can insert their own task files"
  ON public.task_files
  FOR INSERT
  WITH CHECK (
    task_id IN (
      SELECT id FROM public.tasks WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own task files" ON public.task_files;
CREATE POLICY "Users can update their own task files"
  ON public.task_files
  FOR UPDATE
  USING (
    task_id IN (
      SELECT id FROM public.tasks WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their own task files" ON public.task_files;
CREATE POLICY "Users can delete their own task files"
  ON public.task_files
  FOR DELETE
  USING (
    task_id IN (
      SELECT id FROM public.tasks WHERE user_id = auth.uid()
    )
  );

-- Add to realtime publication
alter publication supabase_realtime add table public.task_files;

-- Create function to create task_files table if it doesn't exist
CREATE OR REPLACE FUNCTION public.create_task_files_table_if_not_exists()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Table creation is handled by the migration, this function now just returns
  RETURN;
END;
$$;