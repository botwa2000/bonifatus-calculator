-- Allow date_of_birth to be NULL so registration no longer requires it
ALTER TABLE user_profiles ALTER COLUMN date_of_birth DROP NOT NULL;
