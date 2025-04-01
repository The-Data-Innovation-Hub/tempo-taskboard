-- Create task_assignees junction table
CREATE TABLE IF NOT EXISTS public.task_assignees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, user_id)
);

-- Enable row level security
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;

-- Create policy for task_assignees
DROP POLICY IF EXISTS "Public access to task_assignees" ON public.task_assignees;
CREATE POLICY "Public access to task_assignees"
  ON public.task_assignees
  FOR ALL
  USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_assignees;