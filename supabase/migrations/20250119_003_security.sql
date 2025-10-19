-- Migration: Security Infrastructure
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
