-- This migration completely recreates the test users with proper credentials

-- Create a function to recreate test users
CREATE OR REPLACE FUNCTION recreate_test_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  regular_user_id uuid := '00000000-0000-0000-0000-000000000001';
  admin_user_id uuid := '00000000-0000-0000-0000-000000000002';
BEGIN
  -- First clean up any existing test users to avoid conflicts
  DELETE FROM public.profiles WHERE email IN ('user@example.com', 'admin@example.com');
  DELETE FROM auth.users WHERE email IN ('user@example.com', 'admin@example.com');
  
  -- Try to delete from public.users if it exists
  BEGIN
    DELETE FROM public.users WHERE id IN (regular_user_id, admin_user_id);
  EXCEPTION WHEN undefined_table THEN
    -- Table doesn't exist, ignore
  END;
  
  -- Create regular user with fixed UUID for consistency
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    regular_user_id,
    'authenticated',
    'authenticated',
    'user@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider": "email", "providers": ["email"], "role": "user"}'::jsonb,
    '{"name": "Regular User"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  );
  
  -- Create admin user with fixed UUID for consistency
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    admin_user_id,
    'authenticated',
    'authenticated',
    'admin@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider": "email", "providers": ["email"], "role": "admin"}'::jsonb,
    '{"name": "Admin User"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  );
  
  -- Create profiles for both users
  INSERT INTO public.profiles (id, name, email, role, avatar)
  VALUES 
    (
      regular_user_id,
      'Regular User',
      'user@example.com',
      'user',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=user@example.com'
    ),
    (
      admin_user_id,
      'Admin User',
      'admin@example.com',
      'admin',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=admin@example.com'
    );
  
  -- Create entries in public.users if table exists
  BEGIN
    INSERT INTO public.users (id)
    VALUES 
      (regular_user_id),
      (admin_user_id)
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN undefined_table THEN
    -- Table doesn't exist, ignore
  END;
  
END;
$$;

-- Run the function to recreate test users
SELECT recreate_test_users();

-- Drop the function when done
DROP FUNCTION recreate_test_users();
