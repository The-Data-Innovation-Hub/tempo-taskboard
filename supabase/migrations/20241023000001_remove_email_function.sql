-- This migration doesn't modify the database schema
-- It's a placeholder to indicate that the email function has been removed

DO $$
BEGIN
  RAISE NOTICE 'Email sending functionality has been removed';
  RAISE NOTICE 'No database changes were made by this migration';
END
$$;