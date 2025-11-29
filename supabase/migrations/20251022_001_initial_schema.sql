-- ============================================================================
-- BONIFATUS CALCULATOR - COMPLETE DATABASE SCHEMA
-- Single comprehensive migration for clean database setup
-- ============================================================================

-- ============================================================================
-- PART 0: CLEANUP (ensure no conflicting tables exist)
-- ============================================================================

-- Drop any old conflicting tables that might interfere with FK constraints
DROP TABLE IF EXISTS public.users CASCADE;

-- ============================================================================
-- PART 1: EXTENSIONS AND ENUMS
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- Create all enum types
CREATE TYPE user_role AS ENUM ('parent', 'child');
CREATE TYPE theme_preference AS ENUM ('light', 'dark', 'system');
CREATE TYPE text_direction AS ENUM ('ltr', 'rtl');
CREATE TYPE relationship_type AS ENUM ('parent', 'guardian', 'tutor');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE security_event_type AS ENUM (
    'login_success', 'login_failure', 'password_reset', 'email_change',
    'suspicious_activity', 'account_lockout', 'rate_limit_exceeded', 'unauthorized_access_attempt'
);
CREATE TYPE event_severity AS ENUM ('info', 'warning', 'critical');
CREATE TYPE rate_limit_action AS ENUM ('login', 'register', 'password_reset', 'api_request', 'email_send');
CREATE TYPE verification_purpose AS ENUM ('email_verification', 'password_reset');


-- ============================================================================
-- PART 2: CREATE TABLES (in dependency order)
-- ============================================================================

-- Languages Table (no dependencies)
-- ============================================================================
CREATE TABLE languages (
    code TEXT PRIMARY KEY CHECK (length(code) = 2),
    name_native TEXT NOT NULL,
    name_english TEXT NOT NULL,
    text_direction text_direction NOT NULL DEFAULT 'ltr',
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE languages IS 'Supported application languages';
COMMENT ON COLUMN languages.code IS 'ISO 639-1 two-letter language code';
COMMENT ON COLUMN languages.name_native IS 'Language name in its own language';
COMMENT ON COLUMN languages.text_direction IS 'Text direction: ltr (left-to-right) or rtl (right-to-left)';


-- User Profiles Table (depends on: auth.users, languages)
-- ============================================================================
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    full_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    avatar_url TEXT,
    preferred_language TEXT NOT NULL DEFAULT 'en' REFERENCES languages(code),
    theme_preference theme_preference NOT NULL DEFAULT 'system',
    timezone TEXT NOT NULL DEFAULT 'UTC',
    notification_preferences JSONB NOT NULL DEFAULT '{
        "email_grade_reminders": true,
        "email_reward_updates": true,
        "email_security_alerts": true
    }'::jsonb,
    onboarding_completed BOOLEAN NOT NULL DEFAULT false,
    terms_accepted_at TIMESTAMPTZ,
    privacy_policy_accepted_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_date_of_birth CHECK (date_of_birth <= CURRENT_DATE),
    CONSTRAINT valid_timezone CHECK (timezone ~ '^[A-Za-z_]+/[A-Za-z_]+$' OR timezone = 'UTC'),
    CONSTRAINT terms_accepted_required CHECK (
        (terms_accepted_at IS NOT NULL AND privacy_policy_accepted_at IS NOT NULL) OR
        (terms_accepted_at IS NULL AND privacy_policy_accepted_at IS NULL)
    )
);

COMMENT ON TABLE user_profiles IS 'Extended user profile data - connects to Supabase auth.users';
COMMENT ON COLUMN user_profiles.role IS 'User type: parent or child - determines permissions';
COMMENT ON COLUMN user_profiles.preferred_language IS 'User interface language - references languages.code';


-- Parent-Child Relationships Table (depends on: user_profiles)
-- ============================================================================
CREATE TABLE parent_child_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    relationship_type relationship_type NOT NULL DEFAULT 'parent',
    invitation_status invitation_status NOT NULL DEFAULT 'pending',
    invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    invited_by UUID NOT NULL REFERENCES user_profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_parent_child UNIQUE (parent_id, child_id),
    CONSTRAINT no_self_relationship CHECK (parent_id != child_id),
    CONSTRAINT responded_at_after_invited CHECK (responded_at IS NULL OR responded_at >= invited_at)
);

COMMENT ON TABLE parent_child_relationships IS 'Junction table linking parents to children';


-- Security Events Table (depends on: user_profiles)
-- ============================================================================
CREATE TABLE security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type security_event_type NOT NULL,
    severity event_severity NOT NULL DEFAULT 'info',
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    ip_address INET NOT NULL,
    user_agent TEXT,
    event_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE security_events IS 'Security event log for monitoring and incident response';


-- Rate Limit Tracking Table (no dependencies)
-- ============================================================================
CREATE TABLE rate_limit_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identifier TEXT NOT NULL,
    action_type rate_limit_action NOT NULL,
    window_start TIMESTAMPTZ NOT NULL,
    attempt_count INTEGER NOT NULL DEFAULT 1,
    last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_locked BOOLEAN NOT NULL DEFAULT false,
    locked_until TIMESTAMPTZ,

    CONSTRAINT unique_rate_limit UNIQUE (identifier, action_type, window_start),
    CONSTRAINT valid_lockout CHECK (
        (is_locked = false AND locked_until IS NULL) OR
        (is_locked = true AND locked_until IS NOT NULL)
    )
);

COMMENT ON TABLE rate_limit_tracking IS 'Database-based rate limiting for authentication and API endpoints';


-- Verification Codes Table (depends on: auth.users)
-- ============================================================================
CREATE TABLE verification_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    purpose verification_purpose NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_code_length CHECK (length(code) = 6 AND code ~ '^[0-9]{6}$'),
    CONSTRAINT valid_expiration CHECK (expires_at > created_at),
    CONSTRAINT valid_verification CHECK (
        verified_at IS NULL OR (verified_at >= created_at AND verified_at <= expires_at)
    )
);

COMMENT ON TABLE verification_codes IS 'Stores verification codes for email verification and password reset';


-- ============================================================================
-- PART 3: CREATE INDEXES
-- ============================================================================

-- Languages indexes
CREATE INDEX idx_languages_active ON languages(is_active) WHERE is_active = true;
CREATE INDEX idx_languages_display_order ON languages(display_order, name_english);

-- User profiles indexes
CREATE INDEX idx_user_profiles_role ON user_profiles(role) WHERE is_active = true;
CREATE INDEX idx_user_profiles_is_active ON user_profiles(is_active);
CREATE INDEX idx_user_profiles_created_at ON user_profiles(created_at DESC);
CREATE INDEX idx_user_profiles_full_name_trgm ON user_profiles USING gin(full_name gin_trgm_ops);

-- Relationships indexes
CREATE INDEX idx_relationships_parent ON parent_child_relationships(parent_id);
CREATE INDEX idx_relationships_child ON parent_child_relationships(child_id);
CREATE INDEX idx_relationships_status ON parent_child_relationships(invitation_status) WHERE invitation_status = 'pending';
CREATE INDEX idx_relationships_parent_child ON parent_child_relationships(parent_id, child_id);

-- Security events indexes
CREATE INDEX idx_security_events_user ON security_events(user_id);
CREATE INDEX idx_security_events_type_created ON security_events(event_type, created_at DESC);
CREATE INDEX idx_security_events_severity ON security_events(severity) WHERE severity = 'critical';
CREATE INDEX idx_security_events_ip ON security_events(ip_address);
CREATE INDEX idx_security_events_created ON security_events(created_at DESC);

-- Rate limit indexes
CREATE INDEX idx_rate_limit_identifier ON rate_limit_tracking(identifier, action_type);
CREATE INDEX idx_rate_limit_locked ON rate_limit_tracking(identifier) WHERE is_locked = true;
CREATE INDEX idx_rate_limit_window ON rate_limit_tracking(window_start);

-- Verification codes indexes
CREATE INDEX idx_verification_codes_user ON verification_codes(user_id);
CREATE INDEX idx_verification_codes_code ON verification_codes(code) WHERE verified_at IS NULL;
CREATE INDEX idx_verification_codes_email ON verification_codes(email) WHERE verified_at IS NULL;
CREATE INDEX idx_verification_codes_expires ON verification_codes(expires_at) WHERE verified_at IS NULL;
CREATE INDEX idx_verification_codes_purpose ON verification_codes(purpose, verified_at);
CREATE INDEX idx_verification_codes_active ON verification_codes(user_id, purpose) WHERE verified_at IS NULL;


-- ============================================================================
-- PART 4: CREATE FUNCTIONS
-- ============================================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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

-- Function: Validate relationship roles
CREATE OR REPLACE FUNCTION validate_relationship_roles()
RETURNS TRIGGER AS $$
DECLARE
    parent_role user_role;
    child_role user_role;
BEGIN
    SELECT role INTO parent_role FROM user_profiles WHERE id = NEW.parent_id;
    SELECT role INTO child_role FROM user_profiles WHERE id = NEW.child_id;

    IF parent_role != 'parent' THEN
        RAISE EXCEPTION 'parent_id must reference a user with role=parent';
    END IF;

    IF child_role != 'child' THEN
        RAISE EXCEPTION 'child_id must reference a user with role=child';
    END IF;

    IF NEW.invited_by != NEW.parent_id THEN
        RAISE EXCEPTION 'invited_by must be the parent_id';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Set responded_at when invitation status changes
CREATE OR REPLACE FUNCTION set_responded_at()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.invitation_status = 'pending' AND NEW.invitation_status IN ('accepted', 'rejected') THEN
        NEW.responded_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Log security event
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
    INSERT INTO security_events (event_type, severity, user_id, ip_address, user_agent, event_metadata)
    VALUES (p_event_type, p_severity, p_user_id, p_ip_address, p_user_agent, p_metadata)
    RETURNING id INTO event_id;
    RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check rate limit
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
    current_window := date_trunc('minute', NOW()) -
                      (EXTRACT(MINUTE FROM NOW())::INTEGER % p_window_minutes) * INTERVAL '1 minute';

    SELECT is_locked INTO is_currently_locked
    FROM rate_limit_tracking
    WHERE identifier = p_identifier AND action_type = p_action
    AND is_locked = true AND locked_until > NOW();

    IF is_currently_locked THEN
        RETURN false;
    END IF;

    SELECT attempt_count INTO current_attempts
    FROM rate_limit_tracking
    WHERE identifier = p_identifier AND action_type = p_action AND window_start = current_window;

    IF current_attempts IS NULL OR current_attempts < p_max_attempts THEN
        INSERT INTO rate_limit_tracking (identifier, action_type, window_start, attempt_count)
        VALUES (p_identifier, p_action, current_window, 1)
        ON CONFLICT (identifier, action_type, window_start)
        DO UPDATE SET attempt_count = rate_limit_tracking.attempt_count + 1, last_attempt_at = NOW();
        RETURN true;
    ELSE
        UPDATE rate_limit_tracking
        SET is_locked = true, locked_until = NOW() + (p_window_minutes || ' minutes')::INTERVAL
        WHERE identifier = p_identifier AND action_type = p_action AND window_start = current_window;
        RETURN false;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function: Generate 6-digit verification code
CREATE OR REPLACE FUNCTION generate_verification_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
BEGIN
    code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function: Create verification code
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
    SELECT COUNT(*) INTO recent_codes_count
    FROM verification_codes
    WHERE user_id = p_user_id AND purpose = p_purpose
    AND created_at > NOW() - INTERVAL '1 hour';

    IF recent_codes_count >= 3 THEN
        RAISE EXCEPTION 'Rate limit exceeded. Please wait before requesting another code.';
    END IF;

    v_code := generate_verification_code();
    v_expires_at := NOW() + INTERVAL '15 minutes';

    UPDATE verification_codes SET verified_at = NOW()
    WHERE user_id = p_user_id AND purpose = p_purpose AND verified_at IS NULL;

    INSERT INTO verification_codes (user_id, email, code, purpose, expires_at, ip_address, user_agent)
    VALUES (p_user_id, p_email, v_code, p_purpose, v_expires_at, p_ip_address, p_user_agent);

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
BEGIN
    SELECT * INTO v_record FROM verification_codes
    WHERE user_id = p_user_id AND code = p_code AND purpose = p_purpose AND verified_at IS NULL
    ORDER BY created_at DESC LIMIT 1;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    UPDATE verification_codes SET attempt_count = attempt_count + 1 WHERE id = v_record.id;

    IF v_record.attempt_count >= v_record.max_attempts THEN
        PERFORM log_security_event('suspicious_activity', 'warning', p_user_id, NULL, NULL,
            jsonb_build_object('reason', 'too_many_verification_attempts', 'code_id', v_record.id));
        RETURN false;
    END IF;

    IF v_record.expires_at < NOW() THEN
        RETURN false;
    END IF;

    UPDATE verification_codes SET verified_at = NOW() WHERE id = v_record.id;

    IF p_purpose = 'email_verification' THEN
        UPDATE auth.users SET email_confirmed_at = NOW() WHERE id = p_user_id;
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get verification code status
CREATE OR REPLACE FUNCTION get_verification_code_status(
    p_user_id UUID,
    p_purpose verification_purpose
)
RETURNS TABLE(has_active_code BOOLEAN, expires_at TIMESTAMPTZ, attempt_count INTEGER, max_attempts INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT true, vc.expires_at, vc.attempt_count, vc.max_attempts
    FROM verification_codes vc
    WHERE vc.user_id = p_user_id AND vc.purpose = p_purpose
    AND vc.verified_at IS NULL AND vc.expires_at > NOW()
    ORDER BY vc.created_at DESC LIMIT 1;

    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::TIMESTAMPTZ, 0, 5;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup functions
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
    DELETE FROM rate_limit_tracking
    WHERE window_start < NOW() - INTERVAL '1 hour' AND is_locked = false;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_old_security_events()
RETURNS void AS $$
BEGIN
    DELETE FROM security_events WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_old_verification_codes()
RETURNS void AS $$
BEGIN
    DELETE FROM verification_codes WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- PART 5: CREATE TRIGGERS
-- ============================================================================

-- User profiles triggers
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Relationships triggers
CREATE TRIGGER set_updated_at_relationships
    BEFORE UPDATE ON parent_child_relationships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER validate_relationship_roles_trigger
    BEFORE INSERT OR UPDATE ON parent_child_relationships
    FOR EACH ROW EXECUTE FUNCTION validate_relationship_roles();

CREATE TRIGGER set_responded_at_trigger
    BEFORE UPDATE ON parent_child_relationships
    FOR EACH ROW EXECUTE FUNCTION set_responded_at();


-- ============================================================================
-- PART 6: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_child_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- PART 7: CREATE RLS POLICIES
-- ============================================================================

-- Languages policies
CREATE POLICY "Languages are publicly readable"
    ON languages FOR SELECT USING (true);

-- User profiles policies
CREATE POLICY "Users can read own profile"
    ON user_profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Parents can read linked children profiles"
    ON user_profiles FOR SELECT USING (
        auth.uid() = id OR
        EXISTS (
            SELECT 1 FROM parent_child_relationships
            WHERE parent_id = auth.uid() AND child_id = user_profiles.id
            AND invitation_status = 'accepted'
        )
    );

-- Relationships policies
CREATE POLICY "Parents can create invitations"
    ON parent_child_relationships FOR INSERT WITH CHECK (
        auth.uid() = parent_id AND
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'parent')
    );

CREATE POLICY "Users can read their relationships"
    ON parent_child_relationships FOR SELECT USING (
        auth.uid() = parent_id OR auth.uid() = child_id
    );

CREATE POLICY "Children can update invitation status"
    ON parent_child_relationships FOR UPDATE USING (
        auth.uid() = child_id AND
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'child')
    ) WITH CHECK (auth.uid() = child_id);

CREATE POLICY "Either party can delete relationship"
    ON parent_child_relationships FOR DELETE USING (
        auth.uid() = parent_id OR auth.uid() = child_id
    );

-- Security events policies
CREATE POLICY "Users can read own security events"
    ON security_events FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Parents can read children security events"
    ON security_events FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM parent_child_relationships
            WHERE parent_id = auth.uid() AND child_id = security_events.user_id
            AND invitation_status = 'accepted'
        )
    );

-- Verification codes policies
CREATE POLICY "Users can read own verification codes"
    ON verification_codes FOR SELECT USING (auth.uid() = user_id);


-- ============================================================================
-- PART 8: GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON languages TO anon, authenticated;
GRANT SELECT, UPDATE, INSERT ON user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON parent_child_relationships TO authenticated;
GRANT SELECT ON security_events TO authenticated;
GRANT SELECT ON verification_codes TO authenticated;

GRANT EXECUTE ON FUNCTION log_security_event TO authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION create_verification_code TO authenticated;
GRANT EXECUTE ON FUNCTION verify_code TO authenticated;
GRANT EXECUTE ON FUNCTION get_verification_code_status TO authenticated;


-- ============================================================================
-- PART 9: SEED DATA
-- ============================================================================

INSERT INTO languages (code, name_native, name_english, text_direction, is_active, display_order) VALUES
    ('en', 'English', 'English', 'ltr', true, 1),
    ('de', 'Deutsch', 'German', 'ltr', true, 2),
    ('fr', 'Français', 'French', 'ltr', true, 3)
ON CONFLICT (code) DO NOTHING;


-- ============================================================================
-- SCHEMA SETUP COMPLETE
-- ============================================================================
