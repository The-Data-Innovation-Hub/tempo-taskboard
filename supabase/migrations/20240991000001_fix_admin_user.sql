-- Ensure admin user exists with correct role
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role, created_at, updated_at)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'admin@example.com', '$2a$10$Ql8JxmjrpuWtC.XqJzfYfOKVRdTvPIKP2o1h2PnI17DyEPgGXGE3a', now(), 'admin', now(), now())
ON CONFLICT (id) DO UPDATE
SET role = 'admin', email = 'admin@example.com';

-- Ensure user exists in public.users table
INSERT INTO public.users (id)
VALUES ('00000000-0000-0000-0000-000000000000')
ON CONFLICT (id) DO NOTHING;

-- Ensure profile exists with admin role
INSERT INTO public.profiles (id, email, name, role, avatar, created_at, updated_at)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'admin@example.com', 'Admin User', 'admin', 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin@example.com', now(), now())
ON CONFLICT (id) DO UPDATE
SET role = 'admin', email = 'admin@example.com', name = 'Admin User';
