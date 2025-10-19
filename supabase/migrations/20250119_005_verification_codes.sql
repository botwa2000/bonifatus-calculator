-- Migration: Verification Codes
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
