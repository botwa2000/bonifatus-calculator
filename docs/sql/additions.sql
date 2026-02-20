-- Bonifatus SQL additions (idempotent) — reference data seeding
-- Creates missing reference tables and seeds grading systems, factors, categories, and subjects.

-- Cleanup seeded data (destructive for non-custom/reference rows)
DELETE FROM subjects WHERE is_custom = false;
DELETE FROM subject_categories WHERE name->>'en' IN (
  'STEM','Languages','Social Studies','Arts','PE/Health','Technology','Behavior & Skills'
);
DELETE FROM grading_systems WHERE code IN (
  'pct','us_af','de_15pt','de_16','ru_5to1','uk_gcses_9to1','ib_7','fr_20','es_10','nl_10','dk_12scale','jp_5'
);
DELETE FROM bonus_factor_defaults;

-- Types (create if missing)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'grade_quality_tier') THEN
    CREATE TYPE grade_quality_tier AS ENUM ('best','second','third','below');
  END IF;
END $$;

-- Tables
CREATE TABLE IF NOT EXISTS subject_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name jsonb NOT NULL,
  description jsonb,
  icon text,
  display_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS grading_systems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name jsonb NOT NULL,
  description jsonb,
  country_code text,
  scale_type text NOT NULL,
  min_value numeric,
  max_value numeric,
  best_is_highest boolean NOT NULL DEFAULT true,
  passing_threshold numeric,
  grade_definitions jsonb NOT NULL DEFAULT '[]',
  display_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bonus_factor_defaults (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  factor_type text NOT NULL,
  factor_key text NOT NULL,
  factor_value numeric NOT NULL,
  description jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(factor_type, factor_key)
);

CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid,
  name jsonb NOT NULL,
  description jsonb,
  is_core_subject boolean DEFAULT false,
  is_custom boolean DEFAULT false,
  created_by uuid,
  is_active boolean DEFAULT true,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Seed subject categories
INSERT INTO subject_categories (name, description, display_order, is_active) VALUES
  ('{"en":"STEM"}','{"en":"Science, Technology, Engineering, Math"}',1,true),
  ('{"en":"Languages"}','{"en":"Primary and foreign languages"}',2,true),
  ('{"en":"Social Studies"}','{"en":"History, civics, geography"}',3,true),
  ('{"en":"Arts"}','{"en":"Music, visual, performing arts"}',4,true),
  ('{"en":"PE/Health"}','{"en":"Physical education and health"}',5,true),
  ('{"en":"Technology"}','{"en":"IT, coding, robotics"}',6,true),
  ('{"en":"Behavior & Skills"}','{"en":"Behavior, work habits"}',7,true)
ON CONFLICT DO NOTHING;

-- Seed grading systems
-- Seed/normalize grading systems (consistent naming, display order, country codes)
INSERT INTO grading_systems (code, name, description, scale_type, best_is_highest, min_value, max_value, grade_definitions, display_order, country_code)
VALUES
  ('pct', '{"en":"0–100% (Global)"}', '{"en":"Percentage, 100 best"}', 'percentage', true, 0, 100, '[]', 1, NULL),
  ('us_af', '{"en":"A–F (US/CA/UK/AU)"}', '{"en":"A best → F worst"}', 'letter', true, NULL, NULL, '[
    {"grade":"A","normalized_100":95,"quality_tier":"best"},
    {"grade":"B","normalized_100":85,"quality_tier":"second"},
    {"grade":"C","normalized_100":75,"quality_tier":"third"},
    {"grade":"D","normalized_100":65,"quality_tier":"below"},
    {"grade":"F","normalized_100":50,"quality_tier":"below"}
  ]', 2, 'US'),
  ('de_15pt', '{"en":"15–0 (Germany Abitur)"}', '{"en":"German Abitur 15 best → 0 worst"}', 'numeric', true, 0, 15, '[
    {"grade":"15","normalized_100":100,"quality_tier":"best"},
    {"grade":"14","normalized_100":93,"quality_tier":"best"},
    {"grade":"13","normalized_100":87,"quality_tier":"best"},
    {"grade":"12","normalized_100":80,"quality_tier":"second"},
    {"grade":"11","normalized_100":73,"quality_tier":"second"},
    {"grade":"10","normalized_100":67,"quality_tier":"second"},
    {"grade":"9","normalized_100":60,"quality_tier":"third"},
    {"grade":"8","normalized_100":53,"quality_tier":"third"},
    {"grade":"7","normalized_100":47,"quality_tier":"third"},
    {"grade":"6","normalized_100":40,"quality_tier":"below"},
    {"grade":"5","normalized_100":33,"quality_tier":"below"},
    {"grade":"4","normalized_100":27,"quality_tier":"below"},
    {"grade":"3","normalized_100":20,"quality_tier":"below"},
    {"grade":"2","normalized_100":13,"quality_tier":"below"},
    {"grade":"1","normalized_100":7,"quality_tier":"below"},
    {"grade":"0","normalized_100":0,"quality_tier":"below"}
  ]', 3, 'DE'),
  ('de_16', '{"en":"1–6 (Germany/Austria/Switzerland)"}', '{"en":"1 best → 6 worst"}', 'numeric', false, 1, 6, '[
    {"grade":"1","normalized_100":100,"quality_tier":"best"},
    {"grade":"2","normalized_100":85,"quality_tier":"second"},
    {"grade":"3","normalized_100":70,"quality_tier":"third"},
    {"grade":"4","normalized_100":55,"quality_tier":"below"},
    {"grade":"5","normalized_100":40,"quality_tier":"below"},
    {"grade":"6","normalized_100":25,"quality_tier":"below"}
  ]', 4, 'DE'),
  ('ru_5to1', '{"en":"5–1 (Eastern Europe)"}', '{"en":"5 best → 1 worst"}', 'numeric', true, 1, 5, '[
    {"grade":"5","normalized_100":100,"quality_tier":"best"},
    {"grade":"4","normalized_100":80,"quality_tier":"second"},
    {"grade":"3","normalized_100":60,"quality_tier":"third"},
    {"grade":"2","normalized_100":40,"quality_tier":"below"},
    {"grade":"1","normalized_100":20,"quality_tier":"below"}
  ]', 5, 'RU'),
  ('uk_gcses_9to1', '{"en":"9–1 (GCSE UK)"}', '{"en":"GCSE 9 best → 1 worst"}', 'numeric', true, 1, 9, '[
    {"grade":"9","normalized_100":100,"quality_tier":"best"},
    {"grade":"8","normalized_100":93,"quality_tier":"best"},
    {"grade":"7","normalized_100":86,"quality_tier":"best"},
    {"grade":"6","normalized_100":78,"quality_tier":"second"},
    {"grade":"5","normalized_100":70,"quality_tier":"second"},
    {"grade":"4","normalized_100":62,"quality_tier":"third"},
    {"grade":"3","normalized_100":54,"quality_tier":"below"},
    {"grade":"2","normalized_100":46,"quality_tier":"below"},
    {"grade":"1","normalized_100":38,"quality_tier":"below"}
  ]', 6, 'GB'),
  ('ib_7', '{"en":"1–7 (IB)"}', '{"en":"International Baccalaureate, 7 best → 1 worst"}', 'numeric', true, 1, 7, '[
    {"grade":"7","normalized_100":100,"quality_tier":"best"},
    {"grade":"6","normalized_100":90,"quality_tier":"best"},
    {"grade":"5","normalized_100":80,"quality_tier":"second"},
    {"grade":"4","normalized_100":70,"quality_tier":"second"},
    {"grade":"3","normalized_100":60,"quality_tier":"third"},
    {"grade":"2","normalized_100":50,"quality_tier":"below"},
    {"grade":"1","normalized_100":40,"quality_tier":"below"}
  ]', 7, NULL),
  ('fr_20', '{"en":"20–0 (France)"}', '{"en":"French 20-point scale, 20 best → 0 worst"}', 'numeric', true, 0, 20, '[
    {"grade":"20","normalized_100":100,"quality_tier":"best"},
    {"grade":"18","normalized_100":90,"quality_tier":"best"},
    {"grade":"16","normalized_100":80,"quality_tier":"best"},
    {"grade":"14","normalized_100":70,"quality_tier":"second"},
    {"grade":"12","normalized_100":60,"quality_tier":"second"},
    {"grade":"10","normalized_100":50,"quality_tier":"third"},
    {"grade":"8","normalized_100":40,"quality_tier":"below"},
    {"grade":"6","normalized_100":30,"quality_tier":"below"},
    {"grade":"4","normalized_100":20,"quality_tier":"below"},
    {"grade":"2","normalized_100":10,"quality_tier":"below"},
    {"grade":"0","normalized_100":0,"quality_tier":"below"}
  ]', 8, 'FR'),
  ('es_10', '{"en":"10–0 (Spain/Italy/Brazil)"}', '{"en":"0–10 scale, 10 best → 0 worst"}', 'numeric', true, 0, 10, '[
    {"grade":"10","normalized_100":100,"quality_tier":"best"},
    {"grade":"9","normalized_100":90,"quality_tier":"best"},
    {"grade":"8","normalized_100":80,"quality_tier":"second"},
    {"grade":"7","normalized_100":70,"quality_tier":"second"},
    {"grade":"6","normalized_100":60,"quality_tier":"third"},
    {"grade":"5","normalized_100":50,"quality_tier":"below"},
    {"grade":"4","normalized_100":40,"quality_tier":"below"},
    {"grade":"3","normalized_100":30,"quality_tier":"below"},
    {"grade":"2","normalized_100":20,"quality_tier":"below"},
    {"grade":"1","normalized_100":10,"quality_tier":"below"},
    {"grade":"0","normalized_100":0,"quality_tier":"below"}
  ]', 9, 'ES'),
  ('nl_10', '{"en":"10–1 (Netherlands)"}', '{"en":"Dutch 1–10 scale, 10 best → 1 worst"}', 'numeric', true, 1, 10, '[
    {"grade":"10","normalized_100":100,"quality_tier":"best"},
    {"grade":"9","normalized_100":90,"quality_tier":"best"},
    {"grade":"8","normalized_100":80,"quality_tier":"second"},
    {"grade":"7","normalized_100":70,"quality_tier":"second"},
    {"grade":"6","normalized_100":60,"quality_tier":"third"},
    {"grade":"5","normalized_100":50,"quality_tier":"below"},
    {"grade":"4","normalized_100":40,"quality_tier":"below"},
    {"grade":"3","normalized_100":30,"quality_tier":"below"},
    {"grade":"2","normalized_100":20,"quality_tier":"below"},
    {"grade":"1","normalized_100":10,"quality_tier":"below"}
  ]', 10, 'NL'),
  ('dk_12scale', '{"en":"12–0 (Denmark)"}', '{"en":"Danish 12-scale, 12 best → -3 worst"}', 'numeric', true, -3, 12, '[
    {"grade":"12","normalized_100":100,"quality_tier":"best"},
    {"grade":"10","normalized_100":85,"quality_tier":"best"},
    {"grade":"7","normalized_100":70,"quality_tier":"second"},
    {"grade":"4","normalized_100":55,"quality_tier":"second"},
    {"grade":"02","normalized_100":45,"quality_tier":"third"},
    {"grade":"00","normalized_100":30,"quality_tier":"below"},
    {"grade":"-3","normalized_100":0,"quality_tier":"below"}
  ]', 11, 'DK'),
  ('jp_5', '{"en":"5–1 (Japan)"}', '{"en":"S/A/B/C/F or 5 best → 1 worst"}', 'numeric', true, 1, 5, '[
    {"grade":"5","normalized_100":100,"quality_tier":"best"},
    {"grade":"4","normalized_100":85,"quality_tier":"second"},
    {"grade":"3","normalized_100":70,"quality_tier":"third"},
    {"grade":"2","normalized_100":55,"quality_tier":"below"},
    {"grade":"1","normalized_100":40,"quality_tier":"below"}
  ]', 12, 'JP')
ON CONFLICT (code) DO UPDATE SET
  name = excluded.name,
  description = excluded.description,
  scale_type = excluded.scale_type,
  best_is_highest = excluded.best_is_highest,
  min_value = excluded.min_value,
  max_value = excluded.max_value,
  grade_definitions = excluded.grade_definitions,
  display_order = excluded.display_order,
  country_code = excluded.country_code;

-- Seed bonus factor defaults (with NULL descriptions)
INSERT INTO bonus_factor_defaults (factor_type, factor_key, factor_value, description)
VALUES
  ('class_level','class_1',1,NULL),('class_level','class_2',2,NULL),('class_level','class_3',3,NULL),
  ('class_level','class_4',4,NULL),('class_level','class_5',5,NULL),('class_level','class_6',6,NULL),
  ('class_level','class_7',7,NULL),('class_level','class_8',8,NULL),('class_level','class_9',9,NULL),
  ('class_level','class_10',10,NULL),('class_level','class_11',11,NULL),('class_level','class_12',12,NULL),
  ('term_type','midterm',0.5,NULL),('term_type','final',1,NULL),('term_type','semester',0.5,NULL),('term_type','quarterly',0.25,NULL),
  ('grade_tier','best',2,NULL),('grade_tier','second',1,NULL),('grade_tier','third',0,NULL),('grade_tier','below',-1,NULL)
ON CONFLICT DO NOTHING;

-- Seed subjects (public, non-custom)
WITH cats AS (
  SELECT DISTINCT ON (name->>'en') name->>'en' AS n, id
  FROM subject_categories
  ORDER BY name->>'en', display_order, id
)
INSERT INTO subjects (category_id, name, description, is_core_subject, is_custom, is_active, display_order) VALUES
  -- PE/Health
  ((SELECT id FROM cats WHERE n='PE/Health'), '{"en":"Sports"}','{"en":"Physical education / sports"}', true, false, true, 1),
  ((SELECT id FROM cats WHERE n='PE/Health'), '{"en":"Health"}','{"en":"Health and wellbeing"}', false, false, true, 2),
  -- Behavior & Skills
  ((SELECT id FROM cats WHERE n='Behavior & Skills'), '{"en":"Social Behaviour"}','{"en":"Conduct and social interaction"}', false, false, true, 1),
  ((SELECT id FROM cats WHERE n='Behavior & Skills'), '{"en":"Work Behaviour"}','{"en":"Effort, diligence, homework"}', false, false, true, 2),
  -- Languages (primary/foreign slots)
  ((SELECT id FROM cats WHERE n='Languages'), '{"en":"Primary Language"}','{"en":"First/Native language"}', true, false, true, 1),
  ((SELECT id FROM cats WHERE n='Languages'), '{"en":"Second Primary Language"}','{"en":"Secondary native language (if bilingual)"}', false, false, true, 2),
  ((SELECT id FROM cats WHERE n='Languages'), '{"en":"First Foreign Language"}','{"en":"Main foreign language"}', true, false, true, 3),
  ((SELECT id FROM cats WHERE n='Languages'), '{"en":"Second Foreign Language"}','{"en":"Additional foreign language"}', false, false, true, 4),
  ((SELECT id FROM cats WHERE n='Languages'), '{"en":"Third Foreign Language"}','{"en":"Optional third foreign language"}', false, false, true, 5),
  -- STEM (expanded)
  ((SELECT id FROM cats WHERE n='STEM'), '{"en":"Mathematics"}','{"en":"Mathematics"}', true, false, true, 1),
  ((SELECT id FROM cats WHERE n='STEM'), '{"en":"Algebra"}','{"en":"Algebra"}', true, false, true, 2),
  ((SELECT id FROM cats WHERE n='STEM'), '{"en":"Geometry"}','{"en":"Geometry"}', true, false, true, 3),
  ((SELECT id FROM cats WHERE n='STEM'), '{"en":"Calculus"}','{"en":"Calculus"}', true, false, true, 4),
  ((SELECT id FROM cats WHERE n='STEM'), '{"en":"Statistics"}','{"en":"Statistics"}', true, false, true, 5),
  ((SELECT id FROM cats WHERE n='STEM'), '{"en":"Physics"}','{"en":"Physics"}', true, false, true, 6),
  ((SELECT id FROM cats WHERE n='STEM'), '{"en":"Chemistry"}','{"en":"Chemistry"}', true, false, true, 7),
  ((SELECT id FROM cats WHERE n='STEM'), '{"en":"Biology"}','{"en":"Biology"}', true, false, true, 8),
  ((SELECT id FROM cats WHERE n='STEM'), '{"en":"Computer Science"}','{"en":"Computer Science"}', true, false, true, 9),
  -- Social Studies
  ((SELECT id FROM cats WHERE n='Social Studies'), '{"en":"History"}','{"en":"History"}', true, false, true, 1),
  ((SELECT id FROM cats WHERE n='Social Studies'), '{"en":"Geography"}','{"en":"Geography"}', true, false, true, 2),
  ((SELECT id FROM cats WHERE n='Social Studies'), '{"en":"Civics/Government"}','{"en":"Civics and Government"}', true, false, true, 3),
  ((SELECT id FROM cats WHERE n='Social Studies'), '{"en":"Economics"}','{"en":"Economics"}', true, false, true, 4),
  -- Arts
  ((SELECT id FROM cats WHERE n='Arts'), '{"en":"Music"}','{"en":"Music"}', false, false, true, 1),
  ((SELECT id FROM cats WHERE n='Arts'), '{"en":"Visual Arts"}','{"en":"Visual Arts"}', false, false, true, 2),
  ((SELECT id FROM cats WHERE n='Arts'), '{"en":"Drama/Theater"}','{"en":"Drama / Theater"}', false, false, true, 3),
  ((SELECT id FROM cats WHERE n='Arts'), '{"en":"Dance"}','{"en":"Dance"}', false, false, true, 4),
  -- Technology
  ((SELECT id FROM cats WHERE n='Technology'), '{"en":"Information Technology"}','{"en":"IT / Digital literacy"}', true, false, true, 1),
  ((SELECT id FROM cats WHERE n='Technology'), '{"en":"Coding/Programming"}','{"en":"Coding / Programming"}', true, false, true, 2),
  ((SELECT id FROM cats WHERE n='Technology'), '{"en":"Robotics"}','{"en":"Robotics"}', false, false, true, 3)
ON CONFLICT DO NOTHING;

-- Refresh PostgREST schema cache
SELECT pg_notify('pgrst', 'reload schema');
