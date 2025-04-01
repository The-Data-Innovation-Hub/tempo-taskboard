-- Create profiles for the new users if they don't exist already
INSERT INTO profiles (id, name, email, role, avatar)
SELECT 
  auth.uid() as id,
  'Brendan Crossey' as name,
  'brendan@thedatainnovationhub.com' as email,
  'admin' as role,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=brendan@thedatainnovationhub.com' as avatar
FROM auth.users
WHERE email = 'brendan@thedatainnovationhub.com'
AND NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'brendan@thedatainnovationhub.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, name, email, role, avatar)
SELECT 
  auth.uid() as id,
  'Regular User' as name,
  'user@example.com' as email,
  'user' as role,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=user@example.com' as avatar
FROM auth.users
WHERE email = 'user@example.com'
AND NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'user@example.com')
ON CONFLICT (id) DO NOTHING;