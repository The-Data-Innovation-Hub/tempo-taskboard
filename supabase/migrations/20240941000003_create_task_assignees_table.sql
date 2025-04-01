-- Create task_assignees table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.task_assignees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(task_id, user_id)
);

-- Enable row level security
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;

-- Create policy for task_assignees
DROP POLICY IF EXISTS "Public access" ON public.task_assignees;
CREATE POLICY "Public access"
    ON public.task_assignees FOR SELECT
    USING (true);

-- Enable realtime
alter publication supabase_realtime add table public.task_assignees;
