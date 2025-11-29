-- Migration: Language Support (MUST BE FIRST)
-- Creates languages table before user_profiles needs it

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- Create enum for text direction
CREATE TYPE text_direction AS ENUM ('ltr', 'rtl');

-- Languages Table
-- Supported application languages
CREATE TABLE languages (
    -- Primary Key (ISO 639-1 code)
    code TEXT PRIMARY KEY CHECK (length(code) = 2),

    -- Language Names
    name_native TEXT NOT NULL, -- Name in the language itself (e.g., "Deutsch")
    name_english TEXT NOT NULL, -- Name in English (e.g., "German")

    -- Display Properties
    text_direction text_direction NOT NULL DEFAULT 'ltr',
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,

    -- Timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for languages
CREATE INDEX idx_languages_active ON languages(is_active) WHERE is_active = true;
CREATE INDEX idx_languages_display_order ON languages(display_order, name_english);

-- Comments for documentation
COMMENT ON TABLE languages IS 'Supported application languages';
COMMENT ON COLUMN languages.code IS 'ISO 639-1 two-letter language code';
COMMENT ON COLUMN languages.name_native IS 'Language name in its own language';
COMMENT ON COLUMN languages.text_direction IS 'Text direction: ltr (left-to-right) or rtl (right-to-left)';
COMMENT ON COLUMN languages.display_order IS 'Sort order in language selector (lower = higher priority)';

-- Row Level Security (RLS) Policies
ALTER TABLE languages ENABLE ROW LEVEL SECURITY;

-- Policy: Public read access (no authentication required)
CREATE POLICY "Languages are publicly readable"
    ON languages
    FOR SELECT
    USING (true);

-- Grant permissions
GRANT SELECT ON languages TO anon, authenticated;

-- Seed Initial Languages
-- Starting with English, German, and French as specified in requirements
INSERT INTO languages (code, name_native, name_english, text_direction, is_active, display_order) VALUES
    -- English (default)
    ('en', 'English', 'English', 'ltr', true, 1),

    -- German (major target market)
    ('de', 'Deutsch', 'German', 'ltr', true, 2),

    -- French (European market)
    ('fr', 'Français', 'French', 'ltr', true, 3)
ON CONFLICT (code) DO NOTHING;
-- Migration: User Profiles (depends on languages table)
-- Creates user_profiles table with complete production schema
-- This extends Supabase's auth.users table with application-specific data

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
    preferred_language TEXT NOT NULL DEFAULT 'en' REFERENCES languages(code),
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
COMMENT ON COLUMN user_profiles.preferred_language IS 'User interface language - references languages.code';

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

-- Note: Additional policy for parents to read children's profiles will be added
-- in migration 003 after parent_child_relationships table is created

-- Grant permissions
GRANT SELECT, UPDATE ON user_profiles TO authenticated;
GRANT INSERT ON user_profiles TO authenticated;
-- Migration: Parent-Child Relationships (depends on user_profiles)
-- Creates the junction table linking parents to children
-- Supports complex family structures (divorced parents, guardians, etc.)

-- Create enum for relationship types
CREATE TYPE relationship_type AS ENUM ('parent', 'guardian', 'tutor');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'rejected');

-- Parent-Child Relationships Table
-- Many-to-many relationship supporting multiple parents per child
CREATE TABLE parent_child_relationships (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Relationship Participants
    parent_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

    -- Relationship Details
    relationship_type relationship_type NOT NULL DEFAULT 'parent',
    invitation_status invitation_status NOT NULL DEFAULT 'pending',

    -- Invitation Tracking
    invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    invited_by UUID NOT NULL REFERENCES user_profiles(id),

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_parent_child UNIQUE (parent_id, child_id),
    CONSTRAINT no_self_relationship CHECK (parent_id != child_id),
    CONSTRAINT responded_at_after_invited CHECK (responded_at IS NULL OR responded_at >= invited_at)
);

-- Indexes for parent_child_relationships
CREATE INDEX idx_relationships_parent ON parent_child_relationships(parent_id);
CREATE INDEX idx_relationships_child ON parent_child_relationships(child_id);
CREATE INDEX idx_relationships_status ON parent_child_relationships(invitation_status) WHERE invitation_status = 'pending';
CREATE INDEX idx_relationships_parent_child ON parent_child_relationships(parent_id, child_id);

-- Comments for documentation
COMMENT ON TABLE parent_child_relationships IS 'Junction table linking parents to children - supports multiple parents per child';
COMMENT ON COLUMN parent_child_relationships.relationship_type IS 'Type of relationship: parent, guardian, or tutor';
COMMENT ON COLUMN parent_child_relationships.invitation_status IS 'Status of invitation: pending, accepted, or rejected';
COMMENT ON COLUMN parent_child_relationships.invited_by IS 'User who initiated the relationship (usually the parent)';

-- Trigger: Auto-update updated_at
CREATE TRIGGER set_updated_at_relationships
    BEFORE UPDATE ON parent_child_relationships
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function: Validate parent and child roles
CREATE OR REPLACE FUNCTION validate_relationship_roles()
RETURNS TRIGGER AS $$
DECLARE
    parent_role user_role;
    child_role user_role;
BEGIN
    -- Get the roles of both participants
    SELECT role INTO parent_role FROM user_profiles WHERE id = NEW.parent_id;
    SELECT role INTO child_role FROM user_profiles WHERE id = NEW.child_id;

    -- Validate that parent has parent role
    IF parent_role != 'parent' THEN
        RAISE EXCEPTION 'parent_id must reference a user with role=parent';
    END IF;

    -- Validate that child has child role
    IF child_role != 'child' THEN
        RAISE EXCEPTION 'child_id must reference a user with role=child';
    END IF;

    -- Validate that invited_by is the parent
    IF NEW.invited_by != NEW.parent_id THEN
        RAISE EXCEPTION 'invited_by must be the parent_id';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Validate roles before insert/update
CREATE TRIGGER validate_relationship_roles_trigger
    BEFORE INSERT OR UPDATE ON parent_child_relationships
    FOR EACH ROW
    EXECUTE FUNCTION validate_relationship_roles();

-- Function: Set responded_at when status changes
CREATE OR REPLACE FUNCTION set_responded_at()
RETURNS TRIGGER AS $$
BEGIN
    -- If status is being changed from 'pending' to 'accepted' or 'rejected'
    IF OLD.invitation_status = 'pending' AND NEW.invitation_status IN ('accepted', 'rejected') THEN
        NEW.responded_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-set responded_at when invitation is accepted/rejected
CREATE TRIGGER set_responded_at_trigger
    BEFORE UPDATE ON parent_child_relationships
    FOR EACH ROW
    EXECUTE FUNCTION set_responded_at();

-- Row Level Security (RLS) Policies
ALTER TABLE parent_child_relationships ENABLE ROW LEVEL SECURITY;

-- Policy: Parents can create invitations
CREATE POLICY "Parents can create invitations"
    ON parent_child_relationships
    FOR INSERT
    WITH CHECK (
        auth.uid() = parent_id AND
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'parent')
    );

-- Policy: Both parties can read their relationships
CREATE POLICY "Users can read their relationships"
    ON parent_child_relationships
    FOR SELECT
    USING (
        auth.uid() = parent_id OR
        auth.uid() = child_id
    );

-- Policy: Children can update invitation status (accept/reject)
-- Note: RLS policies cannot enforce field-level restrictions, so application
-- code must ensure only invitation_status is updated
CREATE POLICY "Children can update invitation status"
    ON parent_child_relationships
    FOR UPDATE
    USING (
        auth.uid() = child_id AND
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'child')
    )
    WITH CHECK (
        auth.uid() = child_id
    );

-- Policy: Either party can delete the relationship
CREATE POLICY "Either party can delete relationship"
    ON parent_child_relationships
    FOR DELETE
    USING (
        auth.uid() = parent_id OR
        auth.uid() = child_id
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON parent_child_relationships TO authenticated;

-- Now add the missing policy to user_profiles that depends on this table
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
-- Migration: Security Infrastructure (depends on user_profiles and relationships)
-- Creates tables for security monitoring, rate limiting, and audit logging

-- Create enum types for security events
CREATE TYPE security_event_type AS ENUM (
    'login_success',
    'login_failure',
    'password_reset',
    'email_change',
    'suspicious_activity',
    'account_lockout',
    'rate_limit_exceeded',
    'unauthorized_access_attempt'
);

CREATE TYPE event_severity AS ENUM ('info', 'warning', 'critical');

CREATE TYPE rate_limit_action AS ENUM (
    'login',
    'register',
    'password_reset',
    'api_request',
    'email_send'
);

-- Security Events Table
-- Logs security-relevant events for monitoring and incident response
CREATE TABLE security_events (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Event Details
    event_type security_event_type NOT NULL,
    severity event_severity NOT NULL DEFAULT 'info',

    -- User Context (nullable for unauthenticated attempts)
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,

    -- Network Context
    ip_address INET NOT NULL,
    user_agent TEXT,

    -- Additional Metadata
    event_metadata JSONB DEFAULT '{}'::jsonb,

    -- Timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for security_events
CREATE INDEX idx_security_events_user ON security_events(user_id);
CREATE INDEX idx_security_events_type_created ON security_events(event_type, created_at DESC);
CREATE INDEX idx_security_events_severity ON security_events(severity) WHERE severity = 'critical';
CREATE INDEX idx_security_events_ip ON security_events(ip_address);
CREATE INDEX idx_security_events_created ON security_events(created_at DESC);

-- Partial index for recent critical events
CREATE INDEX idx_security_events_recent_critical ON security_events(created_at DESC)
    WHERE severity = 'critical' AND created_at > NOW() - INTERVAL '7 days';

-- Comments for documentation
COMMENT ON TABLE security_events IS 'Security event log for monitoring, alerting, and incident response';
COMMENT ON COLUMN security_events.event_type IS 'Type of security event that occurred';
COMMENT ON COLUMN security_events.severity IS 'Severity level: info, warning, or critical';
COMMENT ON COLUMN security_events.event_metadata IS 'Additional event-specific data (JSON)';

-- Rate Limit Tracking Table
-- Database-based rate limiting (can migrate to Redis later if needed)
CREATE TABLE rate_limit_tracking (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Identifier (can be user_id, IP address, or combination)
    identifier TEXT NOT NULL,

    -- Action being rate-limited
    action_type rate_limit_action NOT NULL,

    -- Rate Limit Window
    window_start TIMESTAMPTZ NOT NULL,
    attempt_count INTEGER NOT NULL DEFAULT 1,
    last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Lockout State
    is_locked BOOLEAN NOT NULL DEFAULT false,
    locked_until TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT unique_rate_limit UNIQUE (identifier, action_type, window_start),
    CONSTRAINT valid_lockout CHECK (
        (is_locked = false AND locked_until IS NULL) OR
        (is_locked = true AND locked_until IS NOT NULL)
    )
);

-- Indexes for rate_limit_tracking
CREATE INDEX idx_rate_limit_identifier ON rate_limit_tracking(identifier, action_type);
CREATE INDEX idx_rate_limit_locked ON rate_limit_tracking(identifier) WHERE is_locked = true;
CREATE INDEX idx_rate_limit_window ON rate_limit_tracking(window_start);

-- Comments for documentation
COMMENT ON TABLE rate_limit_tracking IS 'Database-based rate limiting for authentication and API endpoints';
COMMENT ON COLUMN rate_limit_tracking.identifier IS 'User ID, IP address, or combination for rate limiting';
COMMENT ON COLUMN rate_limit_tracking.window_start IS 'Start of the rate limit window (e.g., 15-minute window)';
COMMENT ON COLUMN rate_limit_tracking.is_locked IS 'Account/IP is currently locked out';

-- Function: Clean up old rate limit records (called periodically)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
    DELETE FROM rate_limit_tracking
    WHERE window_start < NOW() - INTERVAL '1 hour'
    AND is_locked = false;
END;
$$ LANGUAGE plpgsql;

-- Function: Clean up old security events (retain for 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_security_events()
RETURNS void AS $$
BEGIN
    DELETE FROM security_events
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Function: Check if rate limit exceeded
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_identifier TEXT,
    p_action rate_limit_action,
    p_max_attempts INTEGER,
    p_window_minutes INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    current_window TIMESTAMPTZ;
    current_attempts INTEGER;
    is_currently_locked BOOLEAN;
BEGIN
    -- Calculate current window start (round down to window boundary)
    current_window := date_trunc('minute', NOW()) -
                      (EXTRACT(MINUTE FROM NOW())::INTEGER % p_window_minutes) * INTERVAL '1 minute';

    -- Check if currently locked
    SELECT is_locked INTO is_currently_locked
    FROM rate_limit_tracking
    WHERE identifier = p_identifier
    AND action_type = p_action
    AND is_locked = true
    AND locked_until > NOW();

    -- If locked, return false (rate limit exceeded)
    IF is_currently_locked THEN
        RETURN false;
    END IF;

    -- Get current attempt count for this window
    SELECT attempt_count INTO current_attempts
    FROM rate_limit_tracking
    WHERE identifier = p_identifier
    AND action_type = p_action
    AND window_start = current_window;

    -- If no record exists or under limit, allow
    IF current_attempts IS NULL OR current_attempts < p_max_attempts THEN
        -- Increment or create attempt counter
        INSERT INTO rate_limit_tracking (identifier, action_type, window_start, attempt_count)
        VALUES (p_identifier, p_action, current_window, 1)
        ON CONFLICT (identifier, action_type, window_start)
        DO UPDATE SET
            attempt_count = rate_limit_tracking.attempt_count + 1,
            last_attempt_at = NOW();

        RETURN true;
    ELSE
        -- Lock the identifier
        UPDATE rate_limit_tracking
        SET is_locked = true,
            locked_until = NOW() + (p_window_minutes || ' minutes')::INTERVAL
        WHERE identifier = p_identifier
        AND action_type = p_action
        AND window_start = current_window;

        RETURN false;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function: Log security event (helper function)
CREATE OR REPLACE FUNCTION log_security_event(
    p_event_type security_event_type,
    p_severity event_severity,
    p_user_id UUID,
    p_ip_address INET,
    p_user_agent TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO security_events (
        event_type,
        severity,
        user_id,
        ip_address,
        user_agent,
        event_metadata
    ) VALUES (
        p_event_type,
        p_severity,
        p_user_id,
        p_ip_address,
        p_user_agent,
        p_metadata
    ) RETURNING id INTO event_id;

    RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security (RLS) Policies
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_tracking ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own security events
CREATE POLICY "Users can read own security events"
    ON security_events
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: No direct user writes to security_events (system only via function)
-- This is enforced by not granting INSERT permission to authenticated users

-- Policy: Parents can read security events for linked children
CREATE POLICY "Parents can read children security events"
    ON security_events
    FOR SELECT
    USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM parent_child_relationships
            WHERE parent_id = auth.uid()
            AND child_id = security_events.user_id
            AND invitation_status = 'accepted'
        )
    );

-- Policy: No user access to rate_limit_tracking (system only)
-- This table is managed entirely by the application backend

-- Grant permissions
GRANT SELECT ON security_events TO authenticated;
-- Note: No INSERT/UPDATE/DELETE for users - only via SECURITY DEFINER functions
GRANT EXECUTE ON FUNCTION log_security_event TO authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit TO authenticated;
-- Migration: Verification Codes (depends on auth.users and security functions)
-- Creates table for storing email verification codes and password reset codes
-- Supports 6-digit codes with 15-minute expiration

-- Create enum for verification purposes
CREATE TYPE verification_purpose AS ENUM ('email_verification', 'password_reset');

-- Verification Codes Table
CREATE TABLE verification_codes (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- User Reference
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL, -- Store email for reference (in case user changes email)

    -- Code Details
    code TEXT NOT NULL, -- 6-digit code
    purpose verification_purpose NOT NULL,

    -- Expiration and Usage
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,

    -- Metadata
    ip_address INET,
    user_agent TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_code_length CHECK (length(code) = 6 AND code ~ '^[0-9]{6}$'),
    CONSTRAINT valid_expiration CHECK (expires_at > created_at),
    CONSTRAINT valid_verification CHECK (
        verified_at IS NULL OR
        (verified_at >= created_at AND verified_at <= expires_at)
    )
);

-- Indexes for verification_codes
CREATE INDEX idx_verification_codes_user ON verification_codes(user_id);
CREATE INDEX idx_verification_codes_code ON verification_codes(code) WHERE verified_at IS NULL;
CREATE INDEX idx_verification_codes_email ON verification_codes(email) WHERE verified_at IS NULL;
CREATE INDEX idx_verification_codes_expires ON verification_codes(expires_at) WHERE verified_at IS NULL;
CREATE INDEX idx_verification_codes_purpose ON verification_codes(purpose, verified_at);

-- Partial index for active (unverified, unexpired) codes
CREATE INDEX idx_verification_codes_active ON verification_codes(user_id, purpose)
    WHERE verified_at IS NULL AND expires_at > NOW();

-- Comments for documentation
COMMENT ON TABLE verification_codes IS 'Stores verification codes for email verification and password reset';
COMMENT ON COLUMN verification_codes.code IS '6-digit numeric code sent to user email';
COMMENT ON COLUMN verification_codes.purpose IS 'What the code is used for: email_verification or password_reset';
COMMENT ON COLUMN verification_codes.expires_at IS 'Code expiration timestamp (15 minutes from creation)';
COMMENT ON COLUMN verification_codes.verified_at IS 'Timestamp when code was successfully verified (NULL if not verified)';
COMMENT ON COLUMN verification_codes.attempt_count IS 'Number of verification attempts made with this code';
COMMENT ON COLUMN verification_codes.max_attempts IS 'Maximum allowed verification attempts (default 5)';

-- Function: Generate 6-digit verification code
CREATE OR REPLACE FUNCTION generate_verification_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
BEGIN
    -- Generate cryptographically random 6-digit code
    code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function: Create verification code for user
CREATE OR REPLACE FUNCTION create_verification_code(
    p_user_id UUID,
    p_email TEXT,
    p_purpose verification_purpose,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS TABLE(code TEXT, expires_at TIMESTAMPTZ) AS $$
DECLARE
    v_code TEXT;
    v_expires_at TIMESTAMPTZ;
    recent_codes_count INTEGER;
BEGIN
    -- Rate limiting: Check how many codes were created in the last hour
    SELECT COUNT(*) INTO recent_codes_count
    FROM verification_codes
    WHERE user_id = p_user_id
    AND purpose = p_purpose
    AND created_at > NOW() - INTERVAL '1 hour';

    -- Allow maximum 3 code requests per hour
    IF recent_codes_count >= 3 THEN
        RAISE EXCEPTION 'Rate limit exceeded. Please wait before requesting another code.';
    END IF;

    -- Generate new code
    v_code := generate_verification_code();
    v_expires_at := NOW() + INTERVAL '15 minutes';

    -- Invalidate any existing unverified codes for this user and purpose
    UPDATE verification_codes
    SET verified_at = NOW() -- Mark as "used" to invalidate
    WHERE user_id = p_user_id
    AND purpose = p_purpose
    AND verified_at IS NULL;

    -- Insert new verification code
    INSERT INTO verification_codes (
        user_id,
        email,
        code,
        purpose,
        expires_at,
        ip_address,
        user_agent
    ) VALUES (
        p_user_id,
        p_email,
        v_code,
        p_purpose,
        v_expires_at,
        p_ip_address,
        p_user_agent
    );

    -- Return code and expiration
    RETURN QUERY SELECT v_code, v_expires_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Verify code
CREATE OR REPLACE FUNCTION verify_code(
    p_user_id UUID,
    p_code TEXT,
    p_purpose verification_purpose
)
RETURNS BOOLEAN AS $$
DECLARE
    v_record RECORD;
    v_is_valid BOOLEAN := false;
BEGIN
    -- Find the code
    SELECT * INTO v_record
    FROM verification_codes
    WHERE user_id = p_user_id
    AND code = p_code
    AND purpose = p_purpose
    AND verified_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1;

    -- Code not found
    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- Increment attempt count
    UPDATE verification_codes
    SET attempt_count = attempt_count + 1
    WHERE id = v_record.id;

    -- Check if too many attempts
    IF v_record.attempt_count >= v_record.max_attempts THEN
        -- Log security event
        PERFORM log_security_event(
            'suspicious_activity',
            'warning',
            p_user_id,
            NULL,
            NULL,
            jsonb_build_object(
                'reason', 'too_many_verification_attempts',
                'code_id', v_record.id
            )
        );
        RETURN false;
    END IF;

    -- Check if expired
    IF v_record.expires_at < NOW() THEN
        RETURN false;
    END IF;

    -- Code is valid - mark as verified
    UPDATE verification_codes
    SET verified_at = NOW()
    WHERE id = v_record.id;

    -- If email verification, mark user's email as confirmed in auth.users
    IF p_purpose = 'email_verification' THEN
        UPDATE auth.users
        SET email_confirmed_at = NOW()
        WHERE id = p_user_id;
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Clean up old verification codes (retain for 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_verification_codes()
RETURNS void AS $$
BEGIN
    DELETE FROM verification_codes
    WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Function: Get verification code status
CREATE OR REPLACE FUNCTION get_verification_code_status(
    p_user_id UUID,
    p_purpose verification_purpose
)
RETURNS TABLE(
    has_active_code BOOLEAN,
    expires_at TIMESTAMPTZ,
    attempt_count INTEGER,
    max_attempts INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        true,
        vc.expires_at,
        vc.attempt_count,
        vc.max_attempts
    FROM verification_codes vc
    WHERE vc.user_id = p_user_id
    AND vc.purpose = p_purpose
    AND vc.verified_at IS NULL
    AND vc.expires_at > NOW()
    ORDER BY vc.created_at DESC
    LIMIT 1;

    -- If no active code found, return defaults
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::TIMESTAMPTZ, 0, 5;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security (RLS) Policies
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own verification codes
CREATE POLICY "Users can read own verification codes"
    ON verification_codes
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: No direct user writes (codes created via function only)
-- This is enforced by not granting INSERT/UPDATE/DELETE permissions

-- Grant permissions
GRANT SELECT ON verification_codes TO authenticated;
GRANT EXECUTE ON FUNCTION create_verification_code TO authenticated;
GRANT EXECUTE ON FUNCTION verify_code TO authenticated;
GRANT EXECUTE ON FUNCTION get_verification_code_status TO authenticated;
