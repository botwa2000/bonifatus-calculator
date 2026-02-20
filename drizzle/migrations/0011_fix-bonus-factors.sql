-- ============================================================
-- Fix bonus factor defaults:
-- 1. Class level factors: all set to 1 (flat, no class-based amplification)
-- 2. Term type factors: end-of-year = 1, mid-year = 0.5
-- ============================================================

-- 1. Set all class_level factors to 1
UPDATE bonus_factor_defaults
SET factor_value = 1
WHERE factor_type = 'class_level';

-- 2. End-of-year terms → 1.0
UPDATE bonus_factor_defaults
SET factor_value = 1
WHERE factor_type = 'term_type'
  AND factor_key IN ('semester_2', 'final', 'trimester_3', 'quarter_4');

-- 3. Mid-year terms → 0.5
UPDATE bonus_factor_defaults
SET factor_value = 0.5
WHERE factor_type = 'term_type'
  AND factor_key IN ('semester_1', 'semester', 'midterm', 'quarterly',
                     'trimester_1', 'trimester_2',
                     'quarter_1', 'quarter_2', 'quarter_3');
