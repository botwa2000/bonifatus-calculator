-- Migration: Authentication Foundation
-- Creates user_profiles table with complete production schema
-- This extends Supabase's auth.users table with application-specific data

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- Create enum types
CREATE TYPE user_role AS ENUM ('parent', 'child');
CREATE TYPE theme_preference AS ENUM ('light', 'dark', 'system');

-- User Profiles Table
-- Extends Supabase auth.users with application-specific profile data
-- One-to-one relationship with auth.users (id is both PK and FK)
CREATE TABLE user_profiles (
    -- Primary Key (references auth.users.id)
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Core Profile Fields
    role user_role NOT NULL,
    full_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL, -- Required for age verification and COPPA compliance
    avatar_url TEXT, -- URL to Supabase Storage

    -- Preferences
    preferred_language TEXT NOT NULL DEFAULT 'en',
    theme_preference theme_preference NOT NULL DEFAULT 'system',
    timezone TEXT NOT NULL DEFAULT 'UTC',
    notification_preferences JSONB NOT NULL DEFAULT '{
        "email_grade_reminders": true,
        "email_reward_updates": true,
        "email_security_alerts": true
    }'::jsonb,

    -- Onboarding & Legal
    onboarding_completed BOOLEAN NOT NULL DEFAULT false,
    terms_accepted_at TIMESTAMPTZ,
    privacy_policy_accepted_at TIMESTAMPTZ,

    -- Soft Delete Support
    is_active BOOLEAN NOT NULL DEFAULT true,
    deleted_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_date_of_birth CHECK (date_of_birth <= CURRENT_DATE),
    CONSTRAINT valid_timezone CHECK (timezone ~ '^[A-Za-z_]+/[A-Za-z_]+$' OR timezone = 'UTC'),
    CONSTRAINT terms_accepted_required CHECK (
        (terms_accepted_at IS NOT NULL AND privacy_policy_accepted_at IS NOT NULL) OR
        (terms_accepted_at IS NULL AND privacy_policy_accepted_at IS NULL)
    )
);

-- Indexes for user_profiles
CREATE INDEX idx_user_profiles_role ON user_profiles(role) WHERE is_active = true;
CREATE INDEX idx_user_profiles_is_active ON user_profiles(is_active);
CREATE INDEX idx_user_profiles_created_at ON user_profiles(created_at DESC);
CREATE INDEX idx_user_profiles_full_name_trgm ON user_profiles USING gin(full_name gin_trgm_ops);

-- Comments for documentation
COMMENT ON TABLE user_profiles IS 'Extended user profile data - connects to Supabase auth.users';
COMMENT ON COLUMN user_profiles.role IS 'User type: parent or child - determines permissions';
COMMENT ON COLUMN user_profiles.date_of_birth IS 'Required for COPPA compliance and age verification';
COMMENT ON COLUMN user_profiles.notification_preferences IS 'JSON object controlling email/push notification settings';
COMMENT ON COLUMN user_profiles.is_active IS 'Soft delete flag - false means account deleted';

-- Function: Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at on user_profiles
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function: Automatically create user_profile when auth.user is created
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- This will be populated from the registration form metadata
    INSERT INTO public.user_profiles (id, role, full_name, date_of_birth)
    VALUES (
        NEW.id,
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'parent'),
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown'),
        COALESCE((NEW.raw_user_meta_data->>'date_of_birth')::date, CURRENT_DATE)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Create profile when user registers via Supabase Auth
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Row Level Security (RLS) Policies for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile"
    ON user_profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON user_profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy: New users can insert their own profile (via trigger, but explicit for safety)
CREATE POLICY "Users can insert own profile"
    ON user_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Policy: Parents can read linked children's profiles (will be enhanced when relationships table exists)
-- Note: This policy will be fully functional after parent_child_relationships table is created
CREATE POLICY "Parents can read linked children profiles"
    ON user_profiles
    FOR SELECT
    USING (
        -- User can read their own profile OR
        auth.uid() = id OR
        -- Parent can read linked child's profile
        EXISTS (
            SELECT 1 FROM parent_child_relationships
            WHERE parent_id = auth.uid()
            AND child_id = user_profiles.id
            AND invitation_status = 'accepted'
        )
    );

-- Grant permissions
GRANT SELECT, UPDATE ON user_profiles TO authenticated;
GRANT INSERT ON user_profiles TO authenticated;
