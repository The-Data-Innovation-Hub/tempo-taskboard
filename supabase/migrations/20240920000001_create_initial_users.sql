-- Create admin user if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'brendan@thedatainnovationhub.com') THEN
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role, raw_app_meta_data, raw_user_meta_data)
    VALUES (
      gen_random_uuid(),
      'brendan@thedatainnovationhub.com',
      crypt('password123', gen_salt('bf')),
      now(),
      'authenticated',
      '{"provider":"email","providers":["email"],"role":"admin"}'::jsonb,
      '{"name":"Admin User"}'::jsonb
    );
  END IF;

  -- Create regular user if not exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'user@example.com') THEN
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role, raw_app_meta_data, raw_user_meta_data)
    VALUES (
      gen_random_uuid(),
      'user@example.com',
      crypt('password123', gen_salt('bf')),
      now(),
      'authenticated',
      '{"provider":"email","providers":["email"],"role":"user"}'::jsonb,
      '{"name":"Regular User"}'::jsonb
    );
  END IF;

  -- Create profiles for users if they don't exist
  INSERT INTO public.profiles (id, name, email, role, avatar)
  SELECT 
    u.id, 
    COALESCE((u.raw_user_meta_data->>'name')::text, 'User'), 
    u.email,
    COALESCE((u.raw_app_meta_data->>'role')::text, 'user'),
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || u.email
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.id
  WHERE p.id IS NULL;
END
$$;
