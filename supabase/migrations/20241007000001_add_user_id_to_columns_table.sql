-- Add user_id column to columns table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'columns' AND column_name = 'user_id') THEN
        ALTER TABLE columns ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Create a permissive RLS policy for columns table
DROP POLICY IF EXISTS "Allow all operations on columns" ON columns;
CREATE POLICY "Allow all operations on columns"
ON columns FOR ALL
USING (true);

-- Enable realtime for columns table
alter publication supabase_realtime add table columns;