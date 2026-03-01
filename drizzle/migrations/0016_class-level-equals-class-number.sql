-- Migration: Change class_level factors so factor = class number
-- Previously: class_1=1.0, class_2=1.1, ..., class_13=2.2  (formula: 1 + (n-1)*0.1)
-- Now: class_1=1, class_2=2, ..., class_13=13  (factor = class number)

UPDATE bonus_factor_defaults SET factor_value = 1  WHERE factor_type = 'class_level' AND factor_key = 'class_1';
UPDATE bonus_factor_defaults SET factor_value = 2  WHERE factor_type = 'class_level' AND factor_key = 'class_2';
UPDATE bonus_factor_defaults SET factor_value = 3  WHERE factor_type = 'class_level' AND factor_key = 'class_3';
UPDATE bonus_factor_defaults SET factor_value = 4  WHERE factor_type = 'class_level' AND factor_key = 'class_4';
UPDATE bonus_factor_defaults SET factor_value = 5  WHERE factor_type = 'class_level' AND factor_key = 'class_5';
UPDATE bonus_factor_defaults SET factor_value = 6  WHERE factor_type = 'class_level' AND factor_key = 'class_6';
UPDATE bonus_factor_defaults SET factor_value = 7  WHERE factor_type = 'class_level' AND factor_key = 'class_7';
UPDATE bonus_factor_defaults SET factor_value = 8  WHERE factor_type = 'class_level' AND factor_key = 'class_8';
UPDATE bonus_factor_defaults SET factor_value = 9  WHERE factor_type = 'class_level' AND factor_key = 'class_9';
UPDATE bonus_factor_defaults SET factor_value = 10 WHERE factor_type = 'class_level' AND factor_key = 'class_10';
UPDATE bonus_factor_defaults SET factor_value = 11 WHERE factor_type = 'class_level' AND factor_key = 'class_11';
UPDATE bonus_factor_defaults SET factor_value = 12 WHERE factor_type = 'class_level' AND factor_key = 'class_12';
UPDATE bonus_factor_defaults SET factor_value = 13 WHERE factor_type = 'class_level' AND factor_key = 'class_13';

-- Also add factors for classes 14-20 (some school systems go higher)
INSERT INTO bonus_factor_defaults (id, factor_type, factor_key, factor_value, description, is_active)
VALUES
  (gen_random_uuid(), 'class_level', 'class_14', 14, 'Class level 14 factor', true),
  (gen_random_uuid(), 'class_level', 'class_15', 15, 'Class level 15 factor', true),
  (gen_random_uuid(), 'class_level', 'class_16', 16, 'Class level 16 factor', true),
  (gen_random_uuid(), 'class_level', 'class_17', 17, 'Class level 17 factor', true),
  (gen_random_uuid(), 'class_level', 'class_18', 18, 'Class level 18 factor', true),
  (gen_random_uuid(), 'class_level', 'class_19', 19, 'Class level 19 factor', true),
  (gen_random_uuid(), 'class_level', 'class_20', 20, 'Class level 20 factor', true)
ON CONFLICT DO NOTHING;

-- Add subject_grades settlement tracking columns
ALTER TABLE subject_grades ADD COLUMN IF NOT EXISTS settlement_status text DEFAULT 'unsettled' NOT NULL;
ALTER TABLE subject_grades ADD COLUMN IF NOT EXISTS settlement_id text REFERENCES settlements(id) ON DELETE SET NULL;
