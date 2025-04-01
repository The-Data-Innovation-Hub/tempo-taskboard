-- Create task_labels junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.task_labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES public.labels(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(task_id, label_id)
);

-- Enable RLS
ALTER TABLE public.task_labels ENABLE ROW LEVEL SECURITY;

-- Create policy for task_labels
DROP POLICY IF EXISTS "Users can view task_labels" ON public.task_labels;
CREATE POLICY "Users can view task_labels"
  ON public.task_labels
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert task_labels" ON public.task_labels;
CREATE POLICY "Users can insert task_labels"
  ON public.task_labels
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update task_labels" ON public.task_labels;
CREATE POLICY "Users can update task_labels"
  ON public.task_labels
  FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Users can delete task_labels" ON public.task_labels;
CREATE POLICY "Users can delete task_labels"
  ON public.task_labels
  FOR DELETE
  USING (true);
