-- Add major international grading systems
-- Ordered by region: DACH, Western Europe, UK, Americas, Asia-Pacific, International

-- Austrian system (1-5, 1 = best)
INSERT INTO grading_systems (id, code, name, description, country_code, scale_type, best_is_highest, min_value, max_value, passing_threshold, grade_definitions, display_order, is_active)
VALUES (
  gen_random_uuid(),
  'AT_1_5',
  '{"de": "Österreichisches Notensystem (1-5)", "en": "Austrian System (1-5)"}',
  '{"de": "Österreichisches Schulnotensystem von 1 (Sehr gut) bis 5 (Nicht genügend)", "en": "Austrian school grading from 1 (Very Good) to 5 (Insufficient)"}',
  'AT',
  'numeric',
  false,
  1, 5, 4,
  '[
    {"grade": "1", "quality_tier": "best", "numeric_value": 1, "normalized_100": 100},
    {"grade": "2", "quality_tier": "second", "numeric_value": 2, "normalized_100": 75},
    {"grade": "3", "quality_tier": "third", "numeric_value": 3, "normalized_100": 50},
    {"grade": "4", "quality_tier": "below", "numeric_value": 4, "normalized_100": 25},
    {"grade": "5", "quality_tier": "below", "numeric_value": 5, "normalized_100": 0}
  ]',
  2, true
);

-- Swiss system (6-1, 6 = best)
INSERT INTO grading_systems (id, code, name, description, country_code, scale_type, best_is_highest, min_value, max_value, passing_threshold, grade_definitions, display_order, is_active)
VALUES (
  gen_random_uuid(),
  'CH_6_1',
  '{"de": "Schweizer Notensystem (6-1)", "en": "Swiss System (6-1)"}',
  '{"de": "Schweizer Schulnotensystem von 6 (ausgezeichnet) bis 1 (sehr schlecht)", "en": "Swiss school grading from 6 (excellent) to 1 (very poor)"}',
  'CH',
  'numeric',
  true,
  1, 6, 4,
  '[
    {"grade": "6", "quality_tier": "best", "numeric_value": 6, "normalized_100": 100},
    {"grade": "5.5", "quality_tier": "best", "numeric_value": 5.5, "normalized_100": 90},
    {"grade": "5", "quality_tier": "second", "numeric_value": 5, "normalized_100": 80},
    {"grade": "4.5", "quality_tier": "second", "numeric_value": 4.5, "normalized_100": 70},
    {"grade": "4", "quality_tier": "third", "numeric_value": 4, "normalized_100": 60},
    {"grade": "3.5", "quality_tier": "below", "numeric_value": 3.5, "normalized_100": 50},
    {"grade": "3", "quality_tier": "below", "numeric_value": 3, "normalized_100": 40},
    {"grade": "2.5", "quality_tier": "below", "numeric_value": 2.5, "normalized_100": 30},
    {"grade": "2", "quality_tier": "below", "numeric_value": 2, "normalized_100": 20},
    {"grade": "1.5", "quality_tier": "below", "numeric_value": 1.5, "normalized_100": 10},
    {"grade": "1", "quality_tier": "below", "numeric_value": 1, "normalized_100": 0}
  ]',
  3, true
);

-- French system (0-20, 20 = best)
INSERT INTO grading_systems (id, code, name, description, country_code, scale_type, best_is_highest, min_value, max_value, passing_threshold, grade_definitions, display_order, is_active)
VALUES (
  gen_random_uuid(),
  'FR_0_20',
  '{"fr": "Système de notation français (0-20)", "en": "French System (0-20)", "de": "Französisches Notensystem (0-20)"}',
  '{"fr": "Notation française de 0 à 20, 10 = passable", "en": "French grading from 0 to 20, 10 = passing", "de": "Französische Benotung von 0 bis 20, 10 = bestanden"}',
  'FR',
  'numeric',
  true,
  0, 20, 10,
  '[
    {"grade": "20", "quality_tier": "best", "numeric_value": 20, "normalized_100": 100},
    {"grade": "19", "quality_tier": "best", "numeric_value": 19, "normalized_100": 95},
    {"grade": "18", "quality_tier": "best", "numeric_value": 18, "normalized_100": 90},
    {"grade": "17", "quality_tier": "best", "numeric_value": 17, "normalized_100": 85},
    {"grade": "16", "quality_tier": "best", "numeric_value": 16, "normalized_100": 80},
    {"grade": "15", "quality_tier": "second", "numeric_value": 15, "normalized_100": 75},
    {"grade": "14", "quality_tier": "second", "numeric_value": 14, "normalized_100": 70},
    {"grade": "13", "quality_tier": "second", "numeric_value": 13, "normalized_100": 65},
    {"grade": "12", "quality_tier": "third", "numeric_value": 12, "normalized_100": 60},
    {"grade": "11", "quality_tier": "third", "numeric_value": 11, "normalized_100": 55},
    {"grade": "10", "quality_tier": "third", "numeric_value": 10, "normalized_100": 50},
    {"grade": "9", "quality_tier": "below", "numeric_value": 9, "normalized_100": 45},
    {"grade": "8", "quality_tier": "below", "numeric_value": 8, "normalized_100": 40},
    {"grade": "7", "quality_tier": "below", "numeric_value": 7, "normalized_100": 35},
    {"grade": "6", "quality_tier": "below", "numeric_value": 6, "normalized_100": 30},
    {"grade": "5", "quality_tier": "below", "numeric_value": 5, "normalized_100": 25},
    {"grade": "4", "quality_tier": "below", "numeric_value": 4, "normalized_100": 20},
    {"grade": "3", "quality_tier": "below", "numeric_value": 3, "normalized_100": 15},
    {"grade": "2", "quality_tier": "below", "numeric_value": 2, "normalized_100": 10},
    {"grade": "1", "quality_tier": "below", "numeric_value": 1, "normalized_100": 5},
    {"grade": "0", "quality_tier": "below", "numeric_value": 0, "normalized_100": 0}
  ]',
  4, true
);

-- Italian system (0-10, 10 = best)
INSERT INTO grading_systems (id, code, name, description, country_code, scale_type, best_is_highest, min_value, max_value, passing_threshold, grade_definitions, display_order, is_active)
VALUES (
  gen_random_uuid(),
  'IT_0_10',
  '{"it": "Sistema di voti italiano (0-10)", "en": "Italian System (0-10)", "de": "Italienisches Notensystem (0-10)"}',
  '{"it": "Voti scolastici da 0 a 10, 6 = sufficiente", "en": "Italian school grading from 0 to 10, 6 = sufficient", "de": "Italienische Schulnoten von 0 bis 10, 6 = ausreichend"}',
  'IT',
  'numeric',
  true,
  0, 10, 6,
  '[
    {"grade": "10", "quality_tier": "best", "numeric_value": 10, "normalized_100": 100},
    {"grade": "9", "quality_tier": "best", "numeric_value": 9, "normalized_100": 90},
    {"grade": "8", "quality_tier": "second", "numeric_value": 8, "normalized_100": 80},
    {"grade": "7", "quality_tier": "second", "numeric_value": 7, "normalized_100": 70},
    {"grade": "6", "quality_tier": "third", "numeric_value": 6, "normalized_100": 60},
    {"grade": "5", "quality_tier": "below", "numeric_value": 5, "normalized_100": 50},
    {"grade": "4", "quality_tier": "below", "numeric_value": 4, "normalized_100": 40},
    {"grade": "3", "quality_tier": "below", "numeric_value": 3, "normalized_100": 30},
    {"grade": "2", "quality_tier": "below", "numeric_value": 2, "normalized_100": 20},
    {"grade": "1", "quality_tier": "below", "numeric_value": 1, "normalized_100": 10},
    {"grade": "0", "quality_tier": "below", "numeric_value": 0, "normalized_100": 0}
  ]',
  5, true
);

-- Spanish system (0-10, 10 = best)
INSERT INTO grading_systems (id, code, name, description, country_code, scale_type, best_is_highest, min_value, max_value, passing_threshold, grade_definitions, display_order, is_active)
VALUES (
  gen_random_uuid(),
  'ES_0_10',
  '{"es": "Sistema de calificación español (0-10)", "en": "Spanish System (0-10)", "de": "Spanisches Notensystem (0-10)"}',
  '{"es": "Calificaciones de 0 a 10, 5 = aprobado", "en": "Spanish grading from 0 to 10, 5 = pass", "de": "Spanische Benotung von 0 bis 10, 5 = bestanden"}',
  'ES',
  'numeric',
  true,
  0, 10, 5,
  '[
    {"grade": "10", "quality_tier": "best", "numeric_value": 10, "normalized_100": 100},
    {"grade": "9", "quality_tier": "best", "numeric_value": 9, "normalized_100": 90},
    {"grade": "8", "quality_tier": "second", "numeric_value": 8, "normalized_100": 80},
    {"grade": "7", "quality_tier": "second", "numeric_value": 7, "normalized_100": 70},
    {"grade": "6", "quality_tier": "third", "numeric_value": 6, "normalized_100": 60},
    {"grade": "5", "quality_tier": "third", "numeric_value": 5, "normalized_100": 50},
    {"grade": "4", "quality_tier": "below", "numeric_value": 4, "normalized_100": 40},
    {"grade": "3", "quality_tier": "below", "numeric_value": 3, "normalized_100": 30},
    {"grade": "2", "quality_tier": "below", "numeric_value": 2, "normalized_100": 20},
    {"grade": "1", "quality_tier": "below", "numeric_value": 1, "normalized_100": 10},
    {"grade": "0", "quality_tier": "below", "numeric_value": 0, "normalized_100": 0}
  ]',
  6, true
);

-- Netherlands system (1-10, 10 = best)
INSERT INTO grading_systems (id, code, name, description, country_code, scale_type, best_is_highest, min_value, max_value, passing_threshold, grade_definitions, display_order, is_active)
VALUES (
  gen_random_uuid(),
  'NL_1_10',
  '{"nl": "Nederlands cijfersysteem (1-10)", "en": "Dutch System (1-10)", "de": "Niederländisches Notensystem (1-10)"}',
  '{"nl": "Nederlandse schoolcijfers van 1 tot 10, 5.5 = voldoende", "en": "Dutch grading from 1 to 10, 5.5 = sufficient", "de": "Niederländische Schulnoten von 1 bis 10, 5,5 = ausreichend"}',
  'NL',
  'numeric',
  true,
  1, 10, 5.5,
  '[
    {"grade": "10", "quality_tier": "best", "numeric_value": 10, "normalized_100": 100},
    {"grade": "9", "quality_tier": "best", "numeric_value": 9, "normalized_100": 89},
    {"grade": "8", "quality_tier": "second", "numeric_value": 8, "normalized_100": 78},
    {"grade": "7", "quality_tier": "second", "numeric_value": 7, "normalized_100": 67},
    {"grade": "6", "quality_tier": "third", "numeric_value": 6, "normalized_100": 56},
    {"grade": "5", "quality_tier": "below", "numeric_value": 5, "normalized_100": 44},
    {"grade": "4", "quality_tier": "below", "numeric_value": 4, "normalized_100": 33},
    {"grade": "3", "quality_tier": "below", "numeric_value": 3, "normalized_100": 22},
    {"grade": "2", "quality_tier": "below", "numeric_value": 2, "normalized_100": 11},
    {"grade": "1", "quality_tier": "below", "numeric_value": 1, "normalized_100": 0}
  ]',
  7, true
);

-- UK GCSE (9-1)
INSERT INTO grading_systems (id, code, name, description, country_code, scale_type, best_is_highest, min_value, max_value, passing_threshold, grade_definitions, display_order, is_active)
VALUES (
  gen_random_uuid(),
  'UK_GCSE_9_1',
  '{"en": "UK GCSE (9-1)"}',
  '{"en": "England GCSE grading from 9 (highest) to 1, standard pass at 4"}',
  'GB',
  'numeric',
  true,
  1, 9, 4,
  '[
    {"grade": "9", "quality_tier": "best", "numeric_value": 9, "normalized_100": 100},
    {"grade": "8", "quality_tier": "best", "numeric_value": 8, "normalized_100": 88},
    {"grade": "7", "quality_tier": "second", "numeric_value": 7, "normalized_100": 75},
    {"grade": "6", "quality_tier": "second", "numeric_value": 6, "normalized_100": 63},
    {"grade": "5", "quality_tier": "third", "numeric_value": 5, "normalized_100": 50},
    {"grade": "4", "quality_tier": "third", "numeric_value": 4, "normalized_100": 38},
    {"grade": "3", "quality_tier": "below", "numeric_value": 3, "normalized_100": 25},
    {"grade": "2", "quality_tier": "below", "numeric_value": 2, "normalized_100": 13},
    {"grade": "1", "quality_tier": "below", "numeric_value": 1, "normalized_100": 0}
  ]',
  8, true
);

-- UK A-Level (A*-E)
INSERT INTO grading_systems (id, code, name, description, country_code, scale_type, best_is_highest, min_value, max_value, passing_threshold, grade_definitions, display_order, is_active)
VALUES (
  gen_random_uuid(),
  'UK_ALEVEL',
  '{"en": "UK A-Level (A*-E)"}',
  '{"en": "England A-Level grading from A* to E, U = ungraded"}',
  'GB',
  'letter',
  true,
  0, 100, 40,
  '[
    {"grade": "A*", "quality_tier": "best", "numeric_value": 100, "normalized_100": 100},
    {"grade": "A", "quality_tier": "best", "numeric_value": 90, "normalized_100": 90},
    {"grade": "B", "quality_tier": "second", "numeric_value": 75, "normalized_100": 75},
    {"grade": "C", "quality_tier": "second", "numeric_value": 60, "normalized_100": 60},
    {"grade": "D", "quality_tier": "third", "numeric_value": 50, "normalized_100": 50},
    {"grade": "E", "quality_tier": "third", "numeric_value": 40, "normalized_100": 40},
    {"grade": "U", "quality_tier": "below", "numeric_value": 0, "normalized_100": 0}
  ]',
  9, true
);

-- Canadian percentage system
INSERT INTO grading_systems (id, code, name, description, country_code, scale_type, best_is_highest, min_value, max_value, passing_threshold, grade_definitions, display_order, is_active)
VALUES (
  gen_random_uuid(),
  'CA_PERCENT',
  '{"en": "Canadian Percentage (0-100)", "fr": "Système canadien en pourcentage (0-100)"}',
  '{"en": "Canadian percentage grading, 50% = pass", "fr": "Notation canadienne en pourcentage, 50% = réussite"}',
  'CA',
  'percentage',
  true,
  0, 100, 50,
  '[
    {"grade": "A+", "quality_tier": "best", "numeric_value": 95, "normalized_100": 95},
    {"grade": "A", "quality_tier": "best", "numeric_value": 87, "normalized_100": 87},
    {"grade": "A-", "quality_tier": "best", "numeric_value": 82, "normalized_100": 82},
    {"grade": "B+", "quality_tier": "second", "numeric_value": 78, "normalized_100": 78},
    {"grade": "B", "quality_tier": "second", "numeric_value": 73, "normalized_100": 73},
    {"grade": "B-", "quality_tier": "second", "numeric_value": 68, "normalized_100": 68},
    {"grade": "C+", "quality_tier": "third", "numeric_value": 63, "normalized_100": 63},
    {"grade": "C", "quality_tier": "third", "numeric_value": 58, "normalized_100": 58},
    {"grade": "C-", "quality_tier": "third", "numeric_value": 53, "normalized_100": 53},
    {"grade": "D", "quality_tier": "below", "numeric_value": 50, "normalized_100": 50},
    {"grade": "F", "quality_tier": "below", "numeric_value": 25, "normalized_100": 0}
  ]',
  11, true
);

-- Brazilian system (0-10)
INSERT INTO grading_systems (id, code, name, description, country_code, scale_type, best_is_highest, min_value, max_value, passing_threshold, grade_definitions, display_order, is_active)
VALUES (
  gen_random_uuid(),
  'BR_0_10',
  '{"pt": "Sistema de notas brasileiro (0-10)", "en": "Brazilian System (0-10)"}',
  '{"pt": "Notas escolares de 0 a 10, 5 ou 6 = aprovado", "en": "Brazilian grading from 0 to 10, 5 or 6 = pass"}',
  'BR',
  'numeric',
  true,
  0, 10, 6,
  '[
    {"grade": "10", "quality_tier": "best", "numeric_value": 10, "normalized_100": 100},
    {"grade": "9", "quality_tier": "best", "numeric_value": 9, "normalized_100": 90},
    {"grade": "8", "quality_tier": "second", "numeric_value": 8, "normalized_100": 80},
    {"grade": "7", "quality_tier": "second", "numeric_value": 7, "normalized_100": 70},
    {"grade": "6", "quality_tier": "third", "numeric_value": 6, "normalized_100": 60},
    {"grade": "5", "quality_tier": "below", "numeric_value": 5, "normalized_100": 50},
    {"grade": "4", "quality_tier": "below", "numeric_value": 4, "normalized_100": 40},
    {"grade": "3", "quality_tier": "below", "numeric_value": 3, "normalized_100": 30},
    {"grade": "2", "quality_tier": "below", "numeric_value": 2, "normalized_100": 20},
    {"grade": "1", "quality_tier": "below", "numeric_value": 1, "normalized_100": 10},
    {"grade": "0", "quality_tier": "below", "numeric_value": 0, "normalized_100": 0}
  ]',
  12, true
);

-- Japanese system (5-1, 5 = best)
INSERT INTO grading_systems (id, code, name, description, country_code, scale_type, best_is_highest, min_value, max_value, passing_threshold, grade_definitions, display_order, is_active)
VALUES (
  gen_random_uuid(),
  'JP_5_1',
  '{"ja": "日本の5段階評価 (5-1)", "en": "Japanese System (5-1)", "de": "Japanisches Notensystem (5-1)"}',
  '{"ja": "5段階評価: 5=秀, 1=不可", "en": "Japanese 5-point scale: 5 = Excellent, 1 = Fail", "de": "Japanisches 5-Stufen-System: 5 = Ausgezeichnet, 1 = Durchgefallen"}',
  'JP',
  'numeric',
  true,
  1, 5, 2,
  '[
    {"grade": "5", "quality_tier": "best", "numeric_value": 5, "normalized_100": 100},
    {"grade": "4", "quality_tier": "second", "numeric_value": 4, "normalized_100": 75},
    {"grade": "3", "quality_tier": "third", "numeric_value": 3, "normalized_100": 50},
    {"grade": "2", "quality_tier": "below", "numeric_value": 2, "normalized_100": 25},
    {"grade": "1", "quality_tier": "below", "numeric_value": 1, "normalized_100": 0}
  ]',
  13, true
);

-- Australian system (A-E)
INSERT INTO grading_systems (id, code, name, description, country_code, scale_type, best_is_highest, min_value, max_value, passing_threshold, grade_definitions, display_order, is_active)
VALUES (
  gen_random_uuid(),
  'AU_A_E',
  '{"en": "Australian System (A-E)"}',
  '{"en": "Australian school grading from A (Excellent) to E (Very Low), C = satisfactory"}',
  'AU',
  'letter',
  true,
  0, 100, 50,
  '[
    {"grade": "A", "quality_tier": "best", "numeric_value": 100, "normalized_100": 100},
    {"grade": "B", "quality_tier": "second", "numeric_value": 80, "normalized_100": 80},
    {"grade": "C", "quality_tier": "third", "numeric_value": 60, "normalized_100": 60},
    {"grade": "D", "quality_tier": "below", "numeric_value": 40, "normalized_100": 40},
    {"grade": "E", "quality_tier": "below", "numeric_value": 20, "normalized_100": 0}
  ]',
  14, true
);

-- Indian percentage system
INSERT INTO grading_systems (id, code, name, description, country_code, scale_type, best_is_highest, min_value, max_value, passing_threshold, grade_definitions, display_order, is_active)
VALUES (
  gen_random_uuid(),
  'IN_PERCENT',
  '{"en": "Indian Percentage (0-100)", "hi": "भारतीय प्रतिशत प्रणाली (0-100)"}',
  '{"en": "Indian percentage grading, 33% = pass (CBSE)", "hi": "भारतीय प्रतिशत ग्रेडिंग, 33% = उत्तीर्ण"}',
  'IN',
  'percentage',
  true,
  0, 100, 33,
  '[
    {"grade": "A1", "quality_tier": "best", "numeric_value": 95, "normalized_100": 100},
    {"grade": "A2", "quality_tier": "best", "numeric_value": 85, "normalized_100": 85},
    {"grade": "B1", "quality_tier": "second", "numeric_value": 75, "normalized_100": 75},
    {"grade": "B2", "quality_tier": "second", "numeric_value": 65, "normalized_100": 65},
    {"grade": "C1", "quality_tier": "third", "numeric_value": 55, "normalized_100": 55},
    {"grade": "C2", "quality_tier": "third", "numeric_value": 45, "normalized_100": 45},
    {"grade": "D", "quality_tier": "third", "numeric_value": 35, "normalized_100": 35},
    {"grade": "E1", "quality_tier": "below", "numeric_value": 25, "normalized_100": 25},
    {"grade": "E2", "quality_tier": "below", "numeric_value": 15, "normalized_100": 0}
  ]',
  15, true
);

-- IB (International Baccalaureate) 7-1
INSERT INTO grading_systems (id, code, name, description, country_code, scale_type, best_is_highest, min_value, max_value, passing_threshold, grade_definitions, display_order, is_active)
VALUES (
  gen_random_uuid(),
  'IB_7_1',
  '{"en": "IB (International Baccalaureate) (7-1)", "de": "IB (Internationales Baccalaureate) (7-1)"}',
  '{"en": "IB grading from 7 (Excellent) to 1 (Very Poor), 4 = satisfactory", "de": "IB-Benotung von 7 (Ausgezeichnet) bis 1 (Sehr schlecht), 4 = befriedigend"}',
  NULL,
  'numeric',
  true,
  1, 7, 4,
  '[
    {"grade": "7", "quality_tier": "best", "numeric_value": 7, "normalized_100": 100},
    {"grade": "6", "quality_tier": "best", "numeric_value": 6, "normalized_100": 83},
    {"grade": "5", "quality_tier": "second", "numeric_value": 5, "normalized_100": 67},
    {"grade": "4", "quality_tier": "third", "numeric_value": 4, "normalized_100": 50},
    {"grade": "3", "quality_tier": "below", "numeric_value": 3, "normalized_100": 33},
    {"grade": "2", "quality_tier": "below", "numeric_value": 2, "normalized_100": 17},
    {"grade": "1", "quality_tier": "below", "numeric_value": 1, "normalized_100": 0}
  ]',
  16, true
);

-- Update display_order for existing systems to group DACH first
UPDATE grading_systems SET display_order = 1 WHERE code = 'DE_1_6';
UPDATE grading_systems SET display_order = 10 WHERE code = 'US_LETTER';

-- Fix bonus_factor_defaults factor_type values to match what engine.ts expects
UPDATE bonus_factor_defaults SET factor_type = 'grade_tier' WHERE factor_type = 'grade_multiplier';
UPDATE bonus_factor_defaults SET factor_type = 'class_level', factor_key = CONCAT('class_', SUBSTRING(factor_key FROM '[0-9]+')) WHERE factor_type = 'class_level_bonus';
UPDATE bonus_factor_defaults SET factor_type = 'term_type' WHERE factor_type = 'term_bonus';

-- Add class_level factors for common school levels (if not already present)
INSERT INTO bonus_factor_defaults (id, factor_type, factor_key, factor_value, description, is_active)
SELECT gen_random_uuid(), 'class_level', 'class_' || level, round(1 + (level - 1) * 0.1, 2), 'Multiplier for class level ' || level, true
FROM generate_series(1, 13) AS level
WHERE NOT EXISTS (
  SELECT 1 FROM bonus_factor_defaults WHERE factor_type = 'class_level' AND factor_key = 'class_' || level
);
