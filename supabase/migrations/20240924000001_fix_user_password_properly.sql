-- This migration properly fixes the test user password using Supabase's password hashing method

-- Create a function to properly update the user password
CREATE OR REPLACE FUNCTION fix_user_password_properly()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id uuid;
  user_exists boolean;
BEGIN
  -- Check if user exists
  SELECT EXISTS (SELECT 1 FROM auth.users WHERE email = 'user@example.com') INTO user_exists;
  
  IF user_exists THEN
    -- Get the user ID
    SELECT id INTO user_id FROM auth.users WHERE email = 'user@example.com';
    
    -- Delete from profiles first to avoid foreign key constraint violations
    DELETE FROM public.profiles WHERE id = user_id;
    
    -- Delete from public.users if it exists
    BEGIN
      DELETE FROM public.users WHERE id = user_id;
    EXCEPTION WHEN undefined_table THEN
      -- Table doesn't exist, ignore
    END;
    
    -- Now delete the user from auth.users
    DELETE FROM auth.users WHERE id = user_id;
    
    -- Create the user with proper password
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
      user_id,
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
      '{"provider": "email", "providers": ["email"], "role": "user"}'::jsonb,
      '{"name": "Regular User"}'::jsonb,
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
  END IF;
  
  -- Create entry in public.users if table exists
  BEGIN
    INSERT INTO public.users (id)
    VALUES (user_id)
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN undefined_table THEN
    -- Table doesn't exist, ignore
  END;
  
  -- Also create admin user if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@example.com') THEN
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
    )
    RETURNING id INTO user_id;
    
    -- Create profile for admin user
    INSERT INTO public.profiles (id, name, email, role, avatar)
    VALUES (
      user_id,
      'Admin User',
      'admin@example.com',
      'admin',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=admin@example.com'
    );
    
    -- Create entry in public.users if table exists
    BEGIN
      INSERT INTO public.users (id)
      VALUES (user_id)
      ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN undefined_table THEN
      -- Table doesn't exist, ignore
    END;
  END IF;
  
END;
$$;

-- Run the function to fix credentials
SELECT fix_user_password_properly();

-- Drop the function when done
DROP FUNCTION fix_user_password_properly();
