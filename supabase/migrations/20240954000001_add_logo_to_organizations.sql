-- Add logo field to organizations table if it doesn't exist already
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'logo') THEN
    ALTER TABLE organizations ADD COLUMN logo TEXT;
  END IF;
END $$;

-- Enable storage for organization logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('organization_logos', 'organization_logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to organization logos
DROP POLICY IF EXISTS "Organization logos are publicly accessible" ON storage.objects;
CREATE POLICY "Organization logos are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'organization_logos');

-- Allow authenticated users to upload organization logos
DROP POLICY IF EXISTS "Users can upload organization logos" ON storage.objects;
CREATE POLICY "Users can upload organization logos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'organization_logos');

-- Allow users to update their own organization logos
DROP POLICY IF EXISTS "Users can update their own organization logos" ON storage.objects;
CREATE POLICY "Users can update their own organization logos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'organization_logos');

-- Allow users to delete their own organization logos
DROP POLICY IF EXISTS "Users can delete their own organization logos" ON storage.objects;
CREATE POLICY "Users can delete their own organization logos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'organization_logos');
