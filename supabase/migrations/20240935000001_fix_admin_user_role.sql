-- Fix admin user role
UPDATE profiles
SET role = 'admin'
WHERE email = 'admin@example.com';
