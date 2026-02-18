-- Add aliases column to subjects (alternative names for OCR matching)
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS aliases JSONB DEFAULT '[]';

-- Create scan_config table (parser configuration stored in DB)
CREATE TABLE IF NOT EXISTS scan_config (
  key TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '[]'
);

-- =====================================================================
-- Populate subject aliases (common report card names → subject code)
-- =====================================================================
UPDATE subjects SET aliases = '["Geografie", "Geographie"]'::jsonb WHERE code = 'geography';
UPDATE subjects SET aliases = '["Kunsterziehung", "Kunst", "Zeichnen"]'::jsonb WHERE code = 'visual_arts';
UPDATE subjects SET aliases = '["Werken", "Technik", "Textiles Gestalten"]'::jsonb WHERE code = 'design_technology';
UPDATE subjects SET aliases = '["Sachkunde", "Sachunterricht", "Naturwissenschaften", "NaWi"]'::jsonb WHERE code = 'general_science';
UPDATE subjects SET aliases = '["Gemeinschaftskunde"]'::jsonb WHERE code = 'political_science';
UPDATE subjects SET aliases = '["Hauswirtschaftslehre"]'::jsonb WHERE code = 'home_economics';
-- Religion/Ethik has no code — match by name
UPDATE subjects SET aliases = '["Religion", "Religionslehre", "Ev. Religion", "Kath. Religion", "Ethik"]'::jsonb
  WHERE code IS NULL AND name::text LIKE '%Religion/Ethik%';

-- =====================================================================
-- Populate scan config (keywords used by the text parser)
-- =====================================================================
INSERT INTO scan_config (key, data) VALUES
  ('skip_keywords', '[
    "versetzungsvermerk", "fehltage", "notenstufen", "notenberechnung",
    "arbeitsgemeinschaft", "bemerkungen", "einschätzung", "unterschrift",
    "comments", "signature", "grading scale"
  ]'::jsonb),
  ('behavioral_grades', '[
    "verhalten", "mitarbeit", "betragen", "fleiss", "fleiß", "ordnung",
    "sozialverhalten", "arbeitsverhalten",
    "behavior", "behaviour", "conduct", "effort",
    "comportement", "conduite",
    "comportamento", "condotta",
    "comportamiento", "conducta"
  ]'::jsonb)
ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data;
