-- Migration: Parent-Child Relationships
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
CREATE POLICY "Children can update invitation status"
    ON parent_child_relationships
    FOR UPDATE
    USING (
        auth.uid() = child_id AND
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'child')
    )
    WITH CHECK (
        auth.uid() = child_id AND
        -- Can only change invitation_status, not other fields
        parent_id = OLD.parent_id AND
        child_id = OLD.child_id AND
        invited_by = OLD.invited_by
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
