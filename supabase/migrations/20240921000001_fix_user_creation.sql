-- Create a function to create users with proper password hashing
CREATE OR REPLACE FUNCTION create_auth_user(email TEXT, password TEXT, name TEXT, role TEXT)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Create the user in auth.users
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
    email,
    crypt(password, gen_salt('bf')),
    now(),
    now(),
    now(),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email'], 'role', role),
    jsonb_build_object('name', name),
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO new_user_id;

  -- Create the profile in public.profiles
  INSERT INTO public.profiles (id, name, email, role, avatar)
  VALUES (
    new_user_id,
    name,
    email,
    role,
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || email
  );

  -- Create the user in public.users if the table exists
  BEGIN
    INSERT INTO public.users (id)
    VALUES (new_user_id);
  EXCEPTION WHEN undefined_table THEN
    -- Table doesn't exist, ignore
  END;

  RETURN new_user_id;
END;
$$;

-- Create admin user
SELECT create_auth_user(
  'admin@example.com',
  'password123',
  'Admin User',
  'admin'
);

-- Create regular user
SELECT create_auth_user(
  'user@example.com',
  'password123',
  'Regular User',
  'user'
);

-- Drop the function when done
DROP FUNCTION create_auth_user;
