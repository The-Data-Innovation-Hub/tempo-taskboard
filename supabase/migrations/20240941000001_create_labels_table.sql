-- Create labels table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.labels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    organization_id UUID REFERENCES public.organizations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable row level security
ALTER TABLE public.labels ENABLE ROW LEVEL SECURITY;

-- Create policy for labels
DROP POLICY IF EXISTS "Public access" ON public.labels;
CREATE POLICY "Public access"
    ON public.labels FOR SELECT
    USING (true);

-- Enable realtime
alter publication supabase_realtime add table public.labels;
