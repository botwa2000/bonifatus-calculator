-- Parent-Child Invites table to hold short-lived codes children can redeem

-- ENUM for invite status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invite_status') THEN
        CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'cancelled', 'expired');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS parent_child_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    child_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    code TEXT NOT NULL UNIQUE,
    status invite_status NOT NULL DEFAULT 'pending',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    accepted_at TIMESTAMPTZ
);

COMMENT ON TABLE parent_child_invites IS 'Short-lived invite codes parents share with children to link accounts';

CREATE INDEX IF NOT EXISTS idx_parent_child_invites_parent ON parent_child_invites(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_child_invites_status ON parent_child_invites(status);
CREATE INDEX IF NOT EXISTS idx_parent_child_invites_expires ON parent_child_invites(expires_at);

ALTER TABLE parent_child_invites ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Parents can create invites"
    ON parent_child_invites FOR INSERT WITH CHECK (
        auth.uid() = parent_id
        AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'parent')
    );

CREATE POLICY "Parents can read own invites"
    ON parent_child_invites FOR SELECT USING (auth.uid() = parent_id);

CREATE POLICY "Parents can manage own invites"
    ON parent_child_invites FOR UPDATE USING (auth.uid() = parent_id);

CREATE POLICY "Parents can delete own invites"
    ON parent_child_invites FOR DELETE USING (auth.uid() = parent_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON parent_child_invites TO authenticated;
