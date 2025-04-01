-- Create task_labels junction table
CREATE TABLE IF NOT EXISTS public.task_labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL,
  label_id UUID NOT NULL REFERENCES public.labels(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, label_id)
);

-- Enable row level security
ALTER TABLE public.task_labels ENABLE ROW LEVEL SECURITY;

-- Create policy for task_labels
DROP POLICY IF EXISTS "Public access to task_labels";
CREATE POLICY "Public access to task_labels"
  ON public.task_labels
  FOR ALL
  USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_labels;
