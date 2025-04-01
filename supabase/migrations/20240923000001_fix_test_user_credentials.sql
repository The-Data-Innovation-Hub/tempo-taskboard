-- Fix the test user credentials by updating the existing user rather than deleting

-- Create a function to update test user credentials
CREATE OR REPLACE FUNCTION fix_test_user_credentials()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id uuid;
BEGIN
  -- Find the existing user
  SELECT id INTO user_id FROM auth.users WHERE email = 'user@example.com';
  
  -- If user exists, update their password
  IF user_id IS NOT NULL THEN
    -- Update password in auth.users
    UPDATE auth.users
    SET encrypted_password = crypt('password123', gen_salt('bf'))
    WHERE id = user_id;
    
    -- Ensure profile exists
    INSERT INTO public.profiles (id, name, email, role, avatar)
    VALUES (
      user_id,
      'Regular User',
      'user@example.com',
      'user',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=user@example.com'
    )
    ON CONFLICT (id) 
    DO UPDATE SET
      name = 'Regular User',
      email = 'user@example.com',
      role = 'user',
      avatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=user@example.com';
  ELSE
    -- Create new user if doesn't exist
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
      uuid_generate_v4(),
      'authenticated',
      'authenticated',
      'user@example.com',
      crypt('password123', gen_salt('bf')),
      now(),
      now(),
      now(),
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email'], 'role', 'user'),
      jsonb_build_object('name', 'Regular User'),
      now(),
      now(),
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO user_id;
    
    -- Create profile for new user
    INSERT INTO public.profiles (id, name, email, role, avatar)
    VALUES (
      user_id,
      'Regular User',
      'user@example.com',
      'user',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=user@example.com'
    );
    
    -- Create entry in public.users if table exists
    BEGIN
      INSERT INTO public.users (id)
      VALUES (user_id);
    EXCEPTION WHEN undefined_table THEN
      -- Table doesn't exist, ignore
    END;
  END IF;
END;
$$;

-- Run the function to fix credentials
SELECT fix_test_user_credentials();

-- Drop the function when done
DROP FUNCTION fix_test_user_credentials();
