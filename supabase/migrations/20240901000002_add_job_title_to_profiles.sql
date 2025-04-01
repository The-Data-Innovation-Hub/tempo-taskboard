-- Add job_title column to profiles table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'job_title') THEN
    ALTER TABLE profiles ADD COLUMN job_title TEXT;
  END IF;
END $$;