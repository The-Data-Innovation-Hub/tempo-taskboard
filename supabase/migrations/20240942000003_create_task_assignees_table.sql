-- Create task_assignees junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.task_assignees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(task_id, user_id)
);

-- Enable RLS
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;

-- Create policy for task_assignees
DROP POLICY IF EXISTS "Users can view task_assignees" ON public.task_assignees;
CREATE POLICY "Users can view task_assignees"
  ON public.task_assignees
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert task_assignees" ON public.task_assignees;
CREATE POLICY "Users can insert task_assignees"
  ON public.task_assignees
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update task_assignees" ON public.task_assignees;
CREATE POLICY "Users can update task_assignees"
  ON public.task_assignees
  FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Users can delete task_assignees" ON public.task_assignees;
CREATE POLICY "Users can delete task_assignees"
  ON public.task_assignees
  FOR DELETE
  USING (true);
