-- Create admin user if it doesn't exist
DO $$
BEGIN
  -- Check if the admin user already exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@example.com') THEN
    -- Insert the admin user into auth.users
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role_id)
    VALUES (
      gen_random_uuid(),
      'admin@example.com',
      crypt('password123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"],"role":"admin"}'::jsonb,
      '{"name":"Admin User","role":"admin"}'::jsonb,
      false,
      (SELECT id FROM auth.roles WHERE name = 'authenticated')
    ) RETURNING id INTO _admin_id;

    -- Create the user record in public.users
    INSERT INTO public.users (id)
    VALUES (_admin_id);

    -- Create the profile record
    INSERT INTO public.profiles (id, name, email, role, avatar)
    VALUES (
      _admin_id,
      'Admin User',
      'admin@example.com',
      'admin',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=admin@example.com'
    );
  END IF;
END
$$;