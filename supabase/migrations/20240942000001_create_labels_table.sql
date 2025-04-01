-- Create labels table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.labels ENABLE ROW LEVEL SECURITY;

-- Create policy for labels
DROP POLICY IF EXISTS "Users can view labels" ON public.labels;
CREATE POLICY "Users can view labels"
  ON public.labels
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert labels" ON public.labels;
CREATE POLICY "Users can insert labels"
  ON public.labels
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update labels" ON public.labels;
CREATE POLICY "Users can update labels"
  ON public.labels
  FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Users can delete labels" ON public.labels;
CREATE POLICY "Users can delete labels"
  ON public.labels
  FOR DELETE
  USING (true);
