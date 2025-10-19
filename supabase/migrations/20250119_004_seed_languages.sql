-- Migration: Language Support
-- Creates languages table and seeds with initial supported languages

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

-- Add constraint to user_profiles to ensure valid language reference
ALTER TABLE user_profiles
ADD CONSTRAINT fk_preferred_language
FOREIGN KEY (preferred_language) REFERENCES languages(code);

-- Update user_profiles comment
COMMENT ON COLUMN user_profiles.preferred_language IS 'User interface language - references languages.code';
