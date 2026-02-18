-- ============================================================
-- Fix bonus calculation: add class_level factors, international
-- term types, and remove term_type enum constraint
-- ============================================================

-- 1. Change term_type from enum to text (term_grades table is empty)
ALTER TABLE term_grades ALTER COLUMN term_type TYPE text USING term_type::text;

-- 2. Add class_level factors (1.0 for class 1 → 2.2 for class 13)
INSERT INTO bonus_factor_defaults (id, factor_type, factor_key, factor_value, description, is_active)
SELECT gen_random_uuid(), 'class_level', 'class_' || level,
       round(1 + (level - 1) * 0.1, 2),
       'Multiplier for class level ' || level, true
FROM generate_series(1, 13) AS level
WHERE NOT EXISTS (
  SELECT 1 FROM bonus_factor_defaults
  WHERE factor_type = 'class_level' AND factor_key = 'class_' || level
);

-- 3. Add international term type factors
INSERT INTO bonus_factor_defaults (id, factor_type, factor_key, factor_value, description, is_active) VALUES
  (gen_random_uuid(), 'term_type', 'semester_1', 0.8, '1st semester (mid-year)', true),
  (gen_random_uuid(), 'term_type', 'semester_2', 1.0, '2nd semester (end of year)', true),
  (gen_random_uuid(), 'term_type', 'trimester_1', 0.7, '1st trimester', true),
  (gen_random_uuid(), 'term_type', 'trimester_2', 0.8, '2nd trimester', true),
  (gen_random_uuid(), 'term_type', 'trimester_3', 1.0, '3rd trimester (end of year)', true),
  (gen_random_uuid(), 'term_type', 'quarter_1', 0.6, '1st quarter', true),
  (gen_random_uuid(), 'term_type', 'quarter_2', 0.7, '2nd quarter', true),
  (gen_random_uuid(), 'term_type', 'quarter_3', 0.8, '3rd quarter', true),
  (gen_random_uuid(), 'term_type', 'quarter_4', 1.0, '4th quarter (end of year)', true)
ON CONFLICT DO NOTHING;

-- 4. Add term_types configuration with localized labels and groups
INSERT INTO scan_config (key, data) VALUES
('term_types', '{
  "groups": [
    {"code": "semester", "name": {"en": "2 per year", "de": "2 pro Jahr", "fr": "2 par an", "it": "2 all''anno", "es": "2 al año", "ru": "2 в год"}},
    {"code": "trimester", "name": {"en": "3 per year", "de": "3 pro Jahr", "fr": "3 par an", "it": "3 all''anno", "es": "3 al año", "ru": "3 в год"}},
    {"code": "quarter", "name": {"en": "4 per year", "de": "4 pro Jahr", "fr": "4 par an", "it": "4 all''anno", "es": "4 al año", "ru": "4 в год"}}
  ],
  "types": [
    {"code": "semester_1", "group": "semester", "name": {"en": "1st Semester", "de": "1. Halbjahr", "fr": "1er semestre", "it": "1° semestre", "es": "1er semestre", "ru": "1-й семестр"}},
    {"code": "semester_2", "group": "semester", "name": {"en": "2nd Semester / End of Year", "de": "2. Halbjahr / Jahreszeugnis", "fr": "2e semestre / Fin d''année", "it": "2° semestre / Fine anno", "es": "2do semestre / Fin de año", "ru": "2-й семестр / Годовой"}},
    {"code": "trimester_1", "group": "trimester", "name": {"en": "1st Trimester", "de": "1. Trimester", "fr": "1er trimestre", "it": "1° trimestre", "es": "1er trimestre", "ru": "1-й триместр"}},
    {"code": "trimester_2", "group": "trimester", "name": {"en": "2nd Trimester", "de": "2. Trimester", "fr": "2e trimestre", "it": "2° trimestre", "es": "2do trimestre", "ru": "2-й триместр"}},
    {"code": "trimester_3", "group": "trimester", "name": {"en": "3rd Trimester / End of Year", "de": "3. Trimester / Jahreszeugnis", "fr": "3e trimestre / Fin d''année", "it": "3° trimestre / Fine anno", "es": "3er trimestre / Fin de año", "ru": "3-й триместр / Годовой"}},
    {"code": "quarter_1", "group": "quarter", "name": {"en": "1st Quarter", "de": "1. Quartal", "fr": "1er trimestre", "it": "1° quadrimestre", "es": "1er trimestre", "ru": "1-я четверть"}},
    {"code": "quarter_2", "group": "quarter", "name": {"en": "2nd Quarter", "de": "2. Quartal", "fr": "2e trimestre", "it": "2° quadrimestre", "es": "2do trimestre", "ru": "2-я четверть"}},
    {"code": "quarter_3", "group": "quarter", "name": {"en": "3rd Quarter", "de": "3. Quartal", "fr": "3e trimestre", "it": "3° quadrimestre", "es": "3er trimestre", "ru": "3-я четверть"}},
    {"code": "quarter_4", "group": "quarter", "name": {"en": "4th Quarter / End of Year", "de": "4. Quartal / Jahreszeugnis", "fr": "4e trimestre / Fin d''année", "it": "4° quadrimestre / Fine anno", "es": "4to trimestre / Fin de año", "ru": "4-я четверть / Годовой"}}
  ]
}'::jsonb)
ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data;

-- 5. Update term_keywords in scan_config to map to new term type codes
UPDATE scan_config SET data = '{
  "jahreszeugnis":"semester_2","halbjahreszeugnis":"semester_1","zwischenzeugnis":"semester_1",
  "abschlusszeugnis":"semester_2","versetzungszeugnis":"semester_2","zeugnis der allgemeinen hochschulreife":"semester_2",
  "bulletin annuel":"semester_2","bulletin semestriel":"semester_1","bulletin trimestriel":"trimester_3",
  "final report":"semester_2","end of year":"semester_2","mid-term":"semester_1","mid term":"semester_1",
  "midterm":"semester_1","semester":"semester_1","quarterly":"quarter_4","annual report":"semester_2",
  "pagella":"semester_2","pagella finale":"semester_2","scheda di valutazione":"semester_2",
  "primo quadrimestre":"semester_1","secondo quadrimestre":"semester_2",
  "boletín final":"semester_2","boletín trimestral":"trimester_3",
  "calificaciones finales":"semester_2","evaluación trimestral":"trimester_3",
  "годовая оценка":"semester_2","годовая":"semester_2","четвертная оценка":"quarter_4",
  "четвертная":"quarter_4","полугодовая":"semester_1","итоговая аттестация":"semester_2","аттестат":"semester_2"
}'::jsonb
WHERE key = 'term_keywords';
