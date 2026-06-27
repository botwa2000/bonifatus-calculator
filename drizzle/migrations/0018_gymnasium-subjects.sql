-- Add German Gymnasium subjects missing from the catalog
-- Sources: Kaiserin-Friedrich-Gymnasium Zeugnis (Klasse 9, 2025/2026)

-- Fix broken null-code Ethik entry (data integrity)
UPDATE subjects
SET code = 'ethics',
    name = '{"de":"Ethik","en":"Ethics","fr":"Éthique","it":"Etica","es":"Ética","ru":"Этика"}'::jsonb
WHERE code IS NULL AND name->>'de' LIKE '%Ethik%';

-- Politik und Wirtschaft (PoWi) — Hessian combined Politics & Economics subject
INSERT INTO subjects (id, name, description, category_id, is_core_subject, code, aliases, display_order)
VALUES (
  gen_random_uuid()::text,
  '{"de":"Politik und Wirtschaft","en":"Politics & Economics","fr":"Politique et économie","it":"Politica ed economia","es":"Política y economía","ru":"Политика и экономика"}'::jsonb,
  '{"de":"Gesellschafts- und wirtschaftskundliches Pflichtfach an deutschen Gymnasien","en":"Combined civics and economics subject at German Gymnasium"}'::jsonb,
  'fb67b962-9cf2-4859-8de7-7701cbf17efa',
  false,
  'politik_und_wirtschaft',
  '["PoWi","PuW","Politik","Wirtschaft","Gemeinschaftskunde"]'::jsonb,
  50
) ON CONFLICT (code) DO NOTHING;

-- Physik (1. Halbjahr) — Physics first semester grade
INSERT INTO subjects (id, name, description, category_id, is_core_subject, code, aliases, display_order)
VALUES (
  gen_random_uuid()::text,
  '{"de":"Physik (1. Halbjahr)","en":"Physics (1st Semester)","fr":"Physique (1er semestre)","it":"Fisica (1° semestre)","es":"Física (1.er semestre)","ru":"Физика (1-й семестр)"}'::jsonb,
  '{"de":"Physiknote für das 1. Halbjahr","en":"Physics grade for the first semester"}'::jsonb,
  '04704733-f755-42e8-96b3-3b587f059fe7',
  false,
  'physics_h1',
  '["Physik 1. HJ","Physik 1","Physik I","Ph 1"]'::jsonb,
  51
) ON CONFLICT (code) DO NOTHING;

-- Physik (2. Halbjahr) — Physics second semester grade
INSERT INTO subjects (id, name, description, category_id, is_core_subject, code, aliases, display_order)
VALUES (
  gen_random_uuid()::text,
  '{"de":"Physik (2. Halbjahr)","en":"Physics (2nd Semester)","fr":"Physique (2e semestre)","it":"Fisica (2° semestre)","es":"Física (2.° semestre)","ru":"Физика (2-й семестр)"}'::jsonb,
  '{"de":"Physiknote für das 2. Halbjahr","en":"Physics grade for the second semester"}'::jsonb,
  '04704733-f755-42e8-96b3-3b587f059fe7',
  false,
  'physics_h2',
  '["Physik 2. HJ","Physik 2","Physik II","Ph 2"]'::jsonb,
  52
) ON CONFLICT (code) DO NOTHING;

-- Arbeitsverhalten — assessed on German report cards alongside academic grades
INSERT INTO subjects (id, name, description, category_id, is_core_subject, code, aliases, display_order)
VALUES (
  gen_random_uuid()::text,
  '{"de":"Arbeitsverhalten","en":"Work Conduct","fr":"Comportement de travail","it":"Comportamento di lavoro","es":"Comportamiento de trabajo","ru":"Рабочее поведение"}'::jsonb,
  '{"de":"Beurteilung des Arbeits- und Lernverhaltens","en":"Assessment of work and learning behaviour"}'::jsonb,
  'fb67b962-9cf2-4859-8de7-7701cbf17efa',
  false,
  'arbeitsverhalten',
  '["AV","Lern- und Arbeitsverhalten","Lernverhalten","Fleiß"]'::jsonb,
  53
) ON CONFLICT (code) DO NOTHING;

-- Sozialverhalten — assessed on German report cards alongside academic grades
INSERT INTO subjects (id, name, description, category_id, is_core_subject, code, aliases, display_order)
VALUES (
  gen_random_uuid()::text,
  '{"de":"Sozialverhalten","en":"Social Conduct","fr":"Comportement social","it":"Comportamento sociale","es":"Comportamiento social","ru":"Социальное поведение"}'::jsonb,
  '{"de":"Beurteilung des sozialen Verhaltens in der Klasse","en":"Assessment of social behaviour in class"}'::jsonb,
  'fb67b962-9cf2-4859-8de7-7701cbf17efa',
  false,
  'sozialverhalten',
  '["SV","Soziales Verhalten","Betragen","Verhalten"]'::jsonb,
  54
) ON CONFLICT (code) DO NOTHING;
