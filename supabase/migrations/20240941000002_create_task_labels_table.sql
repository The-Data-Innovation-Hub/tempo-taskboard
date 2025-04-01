-- Create task_labels table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.task_labels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL,
    label_id UUID NOT NULL REFERENCES public.labels(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(task_id, label_id)
);

-- Enable row level security
ALTER TABLE public.task_labels ENABLE ROW LEVEL SECURITY;

-- Create policy for task_labels
DROP POLICY IF EXISTS "Public access" ON public.task_labels;
CREATE POLICY "Public access"
    ON public.task_labels FOR SELECT
    USING (true);

-- Enable realtime
alter publication supabase_realtime add table public.task_labels;
