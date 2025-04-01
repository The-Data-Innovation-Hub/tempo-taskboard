-- Fix projects table constraints
ALTER TABLE IF EXISTS public.projects
  DROP CONSTRAINT IF EXISTS projects_user_id_fkey;

-- Add foreign key constraint with ON DELETE CASCADE
ALTER TABLE IF EXISTS public.projects
  ADD CONSTRAINT projects_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Add organization foreign key constraint with ON DELETE SET NULL
ALTER TABLE IF EXISTS public.projects
  DROP CONSTRAINT IF EXISTS projects_organization_id_fkey;

ALTER TABLE IF EXISTS public.projects
  ADD CONSTRAINT projects_organization_id_fkey
  FOREIGN KEY (organization_id)
  REFERENCES public.organizations(id)
  ON DELETE SET NULL;