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

-- Add realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_files;

-- Create RLS policies for task_files
ALTER TABLE public.task_files ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to select their own task files or files of tasks in projects they are members of
DROP POLICY IF EXISTS "Users can view task files for their tasks or tasks in their projects" ON public.task_files;
CREATE POLICY "Users can view task files for their tasks or tasks in their projects"
  ON public.task_files
  FOR SELECT
  USING (
    task_id IN (
      SELECT t.id FROM public.tasks t
      JOIN public.user_projects up ON t.project_id = up.project_id
      WHERE up.user_id = auth.uid()
    )
  );

-- Policy to allow users to insert task files for their tasks or tasks in projects they are members of
DROP POLICY IF EXISTS "Users can insert task files for their tasks or tasks in their projects" ON public.task_files;
CREATE POLICY "Users can insert task files for their tasks or tasks in their projects"
  ON public.task_files
  FOR INSERT
  WITH CHECK (
    task_id IN (
      SELECT t.id FROM public.tasks t
      JOIN public.user_projects up ON t.project_id = up.project_id
      WHERE up.user_id = auth.uid()
    )
  );

-- Policy to allow users to update task files for their tasks or tasks in projects they are members of
DROP POLICY IF EXISTS "Users can update task files for their tasks or tasks in their projects" ON public.task_files;
CREATE POLICY "Users can update task files for their tasks or tasks in their projects"
  ON public.task_files
  FOR UPDATE
  USING (
    task_id IN (
      SELECT t.id FROM public.tasks t
      JOIN public.user_projects up ON t.project_id = up.project_id
      WHERE up.user_id = auth.uid()
    )
  );

-- Policy to allow users to delete task files for their tasks or tasks in projects they are members of
DROP POLICY IF EXISTS "Users can delete task files for their tasks or tasks in their projects" ON public.task_files;
CREATE POLICY "Users can delete task files for their tasks or tasks in their projects"
  ON public.task_files
  FOR DELETE
  USING (
    task_id IN (
      SELECT t.id FROM public.tasks t
      JOIN public.user_projects up ON t.project_id = up.project_id
      WHERE up.user_id = auth.uid()
    )
  );

-- Create function to create task_files table if it doesn't exist
CREATE OR REPLACE FUNCTION public.create_task_files_table_if_not_exists()
RETURNS void AS $$
BEGIN
  -- This function is called by the edge function to ensure the table exists
  -- The actual creation is done above, so this is just a placeholder
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;