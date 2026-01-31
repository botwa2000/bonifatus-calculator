ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';

-- Set admin role for the designated admin email
UPDATE user_profiles SET role = 'admin'
WHERE id = (SELECT id FROM users WHERE email = 'bonifatus.app@gmail.com');
