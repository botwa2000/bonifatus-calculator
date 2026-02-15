-- Migration: Expand subject catalog to 6 categories, ~46 subjects, 6 locales
-- Also adds code columns for idempotent upserts

-- 1. Add code columns
ALTER TABLE subject_categories ADD COLUMN IF NOT EXISTS code TEXT UNIQUE;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS code TEXT UNIQUE;

-- 2. Backfill codes for existing categories
UPDATE subject_categories SET code = 'languages' WHERE (name->>'en') = 'Languages';
UPDATE subject_categories SET code = 'stem' WHERE (name->>'en') = 'STEM';
UPDATE subject_categories SET code = 'humanities' WHERE (name->>'en') = 'Humanities';
UPDATE subject_categories SET code = 'arts_sports' WHERE (name->>'en') = 'Arts & Sports';

-- 3. Backfill codes for existing subjects
UPDATE subjects SET code = 'german' WHERE (name->>'en') = 'German';
UPDATE subjects SET code = 'english' WHERE (name->>'en') = 'English';
UPDATE subjects SET code = 'french' WHERE (name->>'en') = 'French';
UPDATE subjects SET code = 'mathematics' WHERE (name->>'en') = 'Mathematics';
UPDATE subjects SET code = 'physics' WHERE (name->>'en') = 'Physics';
UPDATE subjects SET code = 'chemistry' WHERE (name->>'en') = 'Chemistry';
UPDATE subjects SET code = 'biology' WHERE (name->>'en') = 'Biology';
UPDATE subjects SET code = 'computer_science' WHERE (name->>'en') = 'Computer Science';
UPDATE subjects SET code = 'history' WHERE (name->>'en') = 'History';
UPDATE subjects SET code = 'geography' WHERE (name->>'en') = 'Geography';
UPDATE subjects SET code = 'social_studies' WHERE (name->>'en') = 'Social Studies';
UPDATE subjects SET code = 'visual_arts' WHERE (name->>'en') = 'Art';
UPDATE subjects SET code = 'music' WHERE (name->>'en') = 'Music';
UPDATE subjects SET code = 'physical_education' WHERE (name->>'en') = 'Physical Education';
UPDATE subjects SET code = 'religious_studies' WHERE (name->>'en') = 'Religion';
UPDATE subjects SET code = 'ethics' WHERE (name->>'en') = 'Ethics';
UPDATE subjects SET code = 'latin' WHERE (name->>'en') = 'Latin';
UPDATE subjects SET code = 'spanish' WHERE (name->>'en') = 'Spanish';
UPDATE subjects SET code = 'economics' WHERE (name->>'en') = 'Economics';
UPDATE subjects SET code = 'philosophy' WHERE (name->>'en') = 'Philosophy';
UPDATE subjects SET code = 'theater_drama' WHERE (name->>'en') = 'Theater/Drama';

-- 4. Update existing categories with 6-locale names and new structure
UPDATE subject_categories SET
  name = '{"en":"Languages","de":"Sprachen","fr":"Langues","it":"Lingue","es":"Idiomas","ru":"Языки"}'::jsonb,
  description = '{"en":"Language subjects","de":"Sprachfächer","fr":"Matières linguistiques","it":"Materie linguistiche","es":"Asignaturas de idiomas","ru":"Языковые предметы"}'::jsonb,
  display_order = 1
WHERE code = 'languages';

-- Rename STEM → mathematics (broader scope)
UPDATE subject_categories SET
  code = 'mathematics',
  name = '{"en":"Mathematics & Informatics","de":"Mathematik & Informatik","fr":"Mathématiques & Informatique","it":"Matematica & Informatica","es":"Matemáticas e Informática","ru":"Математика и информатика"}'::jsonb,
  description = '{"en":"Mathematics and computer science subjects","de":"Mathematik- und Informatikfächer","fr":"Matières de mathématiques et informatique","it":"Materie di matematica e informatica","es":"Asignaturas de matemáticas e informática","ru":"Предметы математики и информатики"}'::jsonb,
  display_order = 2
WHERE code = 'stem';

UPDATE subject_categories SET
  name = '{"en":"Social Sciences & Humanities","de":"Sozial- & Geisteswissenschaften","fr":"Sciences sociales & Humanités","it":"Scienze sociali & Umanistiche","es":"Ciencias sociales y Humanidades","ru":"Общественные и гуманитарные науки"}'::jsonb,
  description = '{"en":"Social sciences and humanities subjects","de":"Sozial- und geisteswissenschaftliche Fächer","fr":"Matières de sciences sociales et humanités","it":"Materie di scienze sociali e umanistiche","es":"Asignaturas de ciencias sociales y humanidades","ru":"Предметы общественных и гуманитарных наук"}'::jsonb,
  display_order = 4
WHERE code = 'humanities';

-- Rename Arts & Sports → arts (separate sports)
UPDATE subject_categories SET
  code = 'arts',
  name = '{"en":"Arts & Music","de":"Kunst & Musik","fr":"Arts & Musique","it":"Arte & Musica","es":"Artes y Música","ru":"Искусство и музыка"}'::jsonb,
  description = '{"en":"Creative arts and music subjects","de":"Kreative Kunst- und Musikfächer","fr":"Matières artistiques et musicales","it":"Materie di arte e musica","es":"Asignaturas de artes y música","ru":"Предметы искусства и музыки"}'::jsonb,
  display_order = 5
WHERE code = 'arts_sports';

-- 5. Insert new categories
INSERT INTO subject_categories (id, code, name, description, display_order, is_active)
VALUES
  (gen_random_uuid(), 'sciences', '{"en":"Natural Sciences","de":"Naturwissenschaften","fr":"Sciences naturelles","it":"Scienze naturali","es":"Ciencias naturales","ru":"Естественные науки"}'::jsonb, '{"en":"Natural science subjects","de":"Naturwissenschaftliche Fächer","fr":"Matières de sciences naturelles","it":"Materie di scienze naturali","es":"Asignaturas de ciencias naturales","ru":"Предметы естественных наук"}'::jsonb, 3, true),
  (gen_random_uuid(), 'sports_health', '{"en":"Sports & Health","de":"Sport & Gesundheit","fr":"Sport & Santé","it":"Sport & Salute","es":"Deportes y Salud","ru":"Спорт и здоровье"}'::jsonb, '{"en":"Sports and health subjects","de":"Sport- und Gesundheitsfächer","fr":"Matières de sport et santé","it":"Materie di sport e salute","es":"Asignaturas de deportes y salud","ru":"Предметы спорта и здоровья"}'::jsonb, 6, true)
ON CONFLICT (code) DO NOTHING;

-- 6. Reassign science subjects from old STEM/mathematics category to sciences
UPDATE subjects SET category_id = (SELECT id FROM subject_categories WHERE code = 'sciences')
WHERE code IN ('physics', 'chemistry', 'biology') AND (SELECT id FROM subject_categories WHERE code = 'sciences') IS NOT NULL;

-- Reassign physical education to sports_health
UPDATE subjects SET category_id = (SELECT id FROM subject_categories WHERE code = 'sports_health')
WHERE code = 'physical_education' AND (SELECT id FROM subject_categories WHERE code = 'sports_health') IS NOT NULL;

-- 7. Update all existing subject names to 6 locales
UPDATE subjects SET name = '{"en":"German","de":"Deutsch","fr":"Allemand","it":"Tedesco","es":"Alemán","ru":"Немецкий"}'::jsonb WHERE code = 'german';
UPDATE subjects SET name = '{"en":"English","de":"Englisch","fr":"Anglais","it":"Inglese","es":"Inglés","ru":"Английский"}'::jsonb WHERE code = 'english';
UPDATE subjects SET name = '{"en":"French","de":"Französisch","fr":"Français","it":"Francese","es":"Francés","ru":"Французский"}'::jsonb WHERE code = 'french';
UPDATE subjects SET name = '{"en":"Spanish","de":"Spanisch","fr":"Espagnol","it":"Spagnolo","es":"Español","ru":"Испанский"}'::jsonb WHERE code = 'spanish';
UPDATE subjects SET name = '{"en":"Latin","de":"Latein","fr":"Latin","it":"Latino","es":"Latín","ru":"Латынь"}'::jsonb WHERE code = 'latin';
UPDATE subjects SET name = '{"en":"Mathematics","de":"Mathematik","fr":"Mathématiques","it":"Matematica","es":"Matemáticas","ru":"Математика"}'::jsonb WHERE code = 'mathematics';
UPDATE subjects SET name = '{"en":"Computer Science","de":"Informatik","fr":"Informatique","it":"Informatica","es":"Informática","ru":"Информатика"}'::jsonb WHERE code = 'computer_science';
UPDATE subjects SET name = '{"en":"Physics","de":"Physik","fr":"Physique","it":"Fisica","es":"Física","ru":"Физика"}'::jsonb WHERE code = 'physics';
UPDATE subjects SET name = '{"en":"Chemistry","de":"Chemie","fr":"Chimie","it":"Chimica","es":"Química","ru":"Химия"}'::jsonb WHERE code = 'chemistry';
UPDATE subjects SET name = '{"en":"Biology","de":"Biologie","fr":"Biologie","it":"Biologia","es":"Biología","ru":"Биология"}'::jsonb WHERE code = 'biology';
UPDATE subjects SET name = '{"en":"History","de":"Geschichte","fr":"Histoire","it":"Storia","es":"Historia","ru":"История"}'::jsonb WHERE code = 'history';
UPDATE subjects SET name = '{"en":"Geography","de":"Erdkunde","fr":"Géographie","it":"Geografia","es":"Geografía","ru":"География"}'::jsonb WHERE code = 'geography';
UPDATE subjects SET name = '{"en":"Social Studies","de":"Sozialkunde","fr":"Études sociales","it":"Studi sociali","es":"Estudios sociales","ru":"Обществознание"}'::jsonb WHERE code = 'social_studies';
UPDATE subjects SET name = '{"en":"Visual Arts","de":"Bildende Kunst","fr":"Arts visuels","it":"Arti visive","es":"Artes visuales","ru":"Изобразительное искусство"}'::jsonb WHERE code = 'visual_arts';
UPDATE subjects SET name = '{"en":"Music","de":"Musik","fr":"Musique","it":"Musica","es":"Música","ru":"Музыка"}'::jsonb WHERE code = 'music';
UPDATE subjects SET name = '{"en":"Physical Education","de":"Sport","fr":"Éducation physique","it":"Educazione fisica","es":"Educación física","ru":"Физкультура"}'::jsonb WHERE code = 'physical_education';
UPDATE subjects SET name = '{"en":"Religious Studies","de":"Religion","fr":"Études religieuses","it":"Studi religiosi","es":"Estudios religiosos","ru":"Религиоведение"}'::jsonb WHERE code = 'religious_studies';
UPDATE subjects SET name = '{"en":"Ethics","de":"Ethik","fr":"Éthique","it":"Etica","es":"Ética","ru":"Этика"}'::jsonb WHERE code = 'ethics';
UPDATE subjects SET name = '{"en":"Economics","de":"Wirtschaft","fr":"Économie","it":"Economia","es":"Economía","ru":"Экономика"}'::jsonb WHERE code = 'economics';
UPDATE subjects SET name = '{"en":"Philosophy","de":"Philosophie","fr":"Philosophie","it":"Filosofia","es":"Filosofía","ru":"Философия"}'::jsonb WHERE code = 'philosophy';
UPDATE subjects SET name = '{"en":"Theater/Drama","de":"Theater/Darstellendes Spiel","fr":"Théâtre/Art dramatique","it":"Teatro/Drammaturgia","es":"Teatro/Drama","ru":"Театр/Драма"}'::jsonb WHERE code = 'theater_drama';

-- 8. Insert new subjects

-- Languages (10 new)
INSERT INTO subjects (id, code, name, category_id, is_core_subject, display_order, is_active)
VALUES
  (gen_random_uuid(), 'italian', '{"en":"Italian","de":"Italienisch","fr":"Italien","it":"Italiano","es":"Italiano","ru":"Итальянский"}'::jsonb, (SELECT id FROM subject_categories WHERE code = 'languages'), false, 22, true),
  (gen_random_uuid(), 'russian', '{"en":"Russian","de":"Russisch","fr":"Russe","it":"Russo","es":"Ruso","ru":"Русский"}'::jsonb, (SELECT id FROM subject_categories WHERE code = 'languages'), false, 23, true),
  (gen_random_uuid(), 'portuguese', '{"en":"Portuguese","de":"Portugiesisch","fr":"Portugais","it":"Portoghese","es":"Portugués","ru":"Португальский"}'::jsonb, (SELECT id FROM subject_categories WHERE code = 'languages'), false, 24, true),
  (gen_random_uuid(), 'ancient_greek', '{"en":"Ancient Greek","de":"Altgriechisch","fr":"Grec ancien","it":"Greco antico","es":"Griego antiguo","ru":"Древнегреческий"}'::jsonb, (SELECT id FROM subject_categories WHERE code = 'languages'), false, 25, true),
  (gen_random_uuid(), 'dutch', '{"en":"Dutch","de":"Niederländisch","fr":"Néerlandais","it":"Olandese","es":"Neerlandés","ru":"Нидерландский"}'::jsonb, (SELECT id FROM subject_categories WHERE code = 'languages'), false, 26, true),
  (gen_random_uuid(), 'chinese', '{"en":"Chinese/Mandarin","de":"Chinesisch/Mandarin","fr":"Chinois/Mandarin","it":"Cinese/Mandarino","es":"Chino/Mandarín","ru":"Китайский/Мандарин"}'::jsonb, (SELECT id FROM subject_categories WHERE code = 'languages'), false, 27, true),
  (gen_random_uuid(), 'japanese', '{"en":"Japanese","de":"Japanisch","fr":"Japonais","it":"Giapponese","es":"Japonés","ru":"Японский"}'::jsonb, (SELECT id FROM subject_categories WHERE code = 'languages'), false, 28, true),
  (gen_random_uuid(), 'arabic', '{"en":"Arabic","de":"Arabisch","fr":"Arabe","it":"Arabo","es":"Árabe","ru":"Арабский"}'::jsonb, (SELECT id FROM subject_categories WHERE code = 'languages'), false, 29, true),
  (gen_random_uuid(), 'hindi', '{"en":"Hindi","de":"Hindi","fr":"Hindi","it":"Hindi","es":"Hindi","ru":"Хинди"}'::jsonb, (SELECT id FROM subject_categories WHERE code = 'languages'), false, 30, true),
  (gen_random_uuid(), 'sanskrit', '{"en":"Sanskrit","de":"Sanskrit","fr":"Sanskrit","it":"Sanscrito","es":"Sánscrito","ru":"Санскрит"}'::jsonb, (SELECT id FROM subject_categories WHERE code = 'languages'), false, 31, true)
ON CONFLICT (code) DO NOTHING;

-- Mathematics & Informatics (1 new - Statistics)
INSERT INTO subjects (id, code, name, category_id, is_core_subject, display_order, is_active)
VALUES
  (gen_random_uuid(), 'statistics', '{"en":"Statistics","de":"Statistik","fr":"Statistiques","it":"Statistica","es":"Estadística","ru":"Статистика"}'::jsonb, (SELECT id FROM subject_categories WHERE code = 'mathematics'), false, 32, true)
ON CONFLICT (code) DO NOTHING;

-- Natural Sciences (4 new)
INSERT INTO subjects (id, code, name, category_id, is_core_subject, display_order, is_active)
VALUES
  (gen_random_uuid(), 'earth_science', '{"en":"Earth Science","de":"Erdwissenschaften","fr":"Sciences de la Terre","it":"Scienze della Terra","es":"Ciencias de la Tierra","ru":"Науки о Земле"}'::jsonb, (SELECT id FROM subject_categories WHERE code = 'sciences'), false, 33, true),
  (gen_random_uuid(), 'environmental_science', '{"en":"Environmental Science","de":"Umweltwissenschaften","fr":"Sciences de l''environnement","it":"Scienze ambientali","es":"Ciencias ambientales","ru":"Экология"}'::jsonb, (SELECT id FROM subject_categories WHERE code = 'sciences'), false, 34, true),
  (gen_random_uuid(), 'astronomy', '{"en":"Astronomy","de":"Astronomie","fr":"Astronomie","it":"Astronomia","es":"Astronomía","ru":"Астрономия"}'::jsonb, (SELECT id FROM subject_categories WHERE code = 'sciences'), false, 35, true),
  (gen_random_uuid(), 'general_science', '{"en":"General Science","de":"Allgemeine Naturwissenschaften","fr":"Sciences générales","it":"Scienze generali","es":"Ciencias generales","ru":"Общие естественные науки"}'::jsonb, (SELECT id FROM subject_categories WHERE code = 'sciences'), false, 36, true)
ON CONFLICT (code) DO NOTHING;

-- Humanities (4 new)
INSERT INTO subjects (id, code, name, category_id, is_core_subject, display_order, is_active)
VALUES
  (gen_random_uuid(), 'psychology', '{"en":"Psychology","de":"Psychologie","fr":"Psychologie","it":"Psicologia","es":"Psicología","ru":"Психология"}'::jsonb, (SELECT id FROM subject_categories WHERE code = 'humanities'), false, 37, true),
  (gen_random_uuid(), 'sociology', '{"en":"Sociology","de":"Soziologie","fr":"Sociologie","it":"Sociologia","es":"Sociología","ru":"Социология"}'::jsonb, (SELECT id FROM subject_categories WHERE code = 'humanities'), false, 38, true),
  (gen_random_uuid(), 'political_science', '{"en":"Political Science/Civics","de":"Politikwissenschaft/Gemeinschaftskunde","fr":"Sciences politiques/Éducation civique","it":"Scienze politiche/Educazione civica","es":"Ciencias políticas/Educación cívica","ru":"Политология/Граждановедение"}'::jsonb, (SELECT id FROM subject_categories WHERE code = 'humanities'), false, 39, true),
  (gen_random_uuid(), 'law', '{"en":"Law/Legal Studies","de":"Recht/Rechtskunde","fr":"Droit/Études juridiques","it":"Diritto/Studi giuridici","es":"Derecho/Estudios legales","ru":"Право/Правоведение"}'::jsonb, (SELECT id FROM subject_categories WHERE code = 'humanities'), false, 40, true)
ON CONFLICT (code) DO NOTHING;

-- Arts & Music (4 new)
INSERT INTO subjects (id, code, name, category_id, is_core_subject, display_order, is_active)
VALUES
  (gen_random_uuid(), 'dance', '{"en":"Dance","de":"Tanz","fr":"Danse","it":"Danza","es":"Danza","ru":"Танец"}'::jsonb, (SELECT id FROM subject_categories WHERE code = 'arts'), false, 41, true),
  (gen_random_uuid(), 'film_studies', '{"en":"Film Studies","de":"Filmwissenschaft","fr":"Études cinématographiques","it":"Studi cinematografici","es":"Estudios cinematográficos","ru":"Киноведение"}'::jsonb, (SELECT id FROM subject_categories WHERE code = 'arts'), false, 42, true),
  (gen_random_uuid(), 'media_studies', '{"en":"Media Studies","de":"Medienwissenschaft","fr":"Études des médias","it":"Studi sui media","es":"Estudios de medios","ru":"Медиаведение"}'::jsonb, (SELECT id FROM subject_categories WHERE code = 'arts'), false, 43, true),
  (gen_random_uuid(), 'design_technology', '{"en":"Design & Technology","de":"Design & Technik","fr":"Design & Technologie","it":"Design & Tecnologia","es":"Diseño y Tecnología","ru":"Дизайн и технологии"}'::jsonb, (SELECT id FROM subject_categories WHERE code = 'arts'), false, 44, true)
ON CONFLICT (code) DO NOTHING;

-- Sports & Health (2 new)
INSERT INTO subjects (id, code, name, category_id, is_core_subject, display_order, is_active)
VALUES
  (gen_random_uuid(), 'health_education', '{"en":"Health Education","de":"Gesundheitserziehung","fr":"Éducation à la santé","it":"Educazione alla salute","es":"Educación para la salud","ru":"Здоровьесбережение"}'::jsonb, (SELECT id FROM subject_categories WHERE code = 'sports_health'), false, 45, true),
  (gen_random_uuid(), 'home_economics', '{"en":"Home Economics","de":"Hauswirtschaft","fr":"Économie domestique","it":"Economia domestica","es":"Economía doméstica","ru":"Домоводство"}'::jsonb, (SELECT id FROM subject_categories WHERE code = 'sports_health'), false, 46, true)
ON CONFLICT (code) DO NOTHING;

-- 9. Update grading system names to 6 locales
UPDATE grading_systems SET name = '{"en":"German System (1-6)","de":"Deutsches Notensystem (1-6)","fr":"Système allemand (1-6)","it":"Sistema tedesco (1-6)","es":"Sistema alemán (1-6)","ru":"Немецкая система (1-6)"}'::jsonb WHERE code = 'DE_1_6';
UPDATE grading_systems SET name = '{"en":"US Letter Grade (A-F)","de":"US-Buchstabennoten (A-F)","fr":"Système américain (A-F)","it":"Sistema americano (A-F)","es":"Sistema estadounidense (A-F)","ru":"Американская система (A-F)"}'::jsonb WHERE code = 'US_LETTER';
UPDATE grading_systems SET name = '{"en":"Austrian System (1-5)","de":"Österreichisches Notensystem (1-5)","fr":"Système autrichien (1-5)","it":"Sistema austriaco (1-5)","es":"Sistema austriaco (1-5)","ru":"Австрийская система (1-5)"}'::jsonb WHERE code = 'AT_1_5';
UPDATE grading_systems SET name = '{"en":"Swiss System (6-1)","de":"Schweizer Notensystem (6-1)","fr":"Système suisse (6-1)","it":"Sistema svizzero (6-1)","es":"Sistema suizo (6-1)","ru":"Швейцарская система (6-1)"}'::jsonb WHERE code = 'CH_6_1';
UPDATE grading_systems SET name = '{"en":"UK GCSE (9-1)","de":"UK GCSE (9-1)","fr":"UK GCSE (9-1)","it":"UK GCSE (9-1)","es":"UK GCSE (9-1)","ru":"UK GCSE (9-1)"}'::jsonb WHERE code = 'UK_GCSE';
UPDATE grading_systems SET name = '{"en":"French System (0-20)","de":"Französisches Notensystem (0-20)","fr":"Système français (0-20)","it":"Sistema francese (0-20)","es":"Sistema francés (0-20)","ru":"Французская система (0-20)"}'::jsonb WHERE code = 'FR_0_20';
