-- Add missing subjects commonly found on Berlin Gymnasium (Schul Z 300) and other German report cards

-- Latein (Latin) — common at Gymnasium
INSERT INTO subjects (id, name, description, category_id, is_core_subject, code, aliases, display_order)
VALUES (
  gen_random_uuid()::text,
  '{"de": "Latein", "en": "Latin", "fr": "Latin", "it": "Latino", "es": "Latín", "ru": "Латинский"}'::jsonb,
  '{"de": "Lateinische Sprache", "en": "Latin language"}'::jsonb,
  '6c8be022-9c75-4b23-998b-3562d547cebe', -- Sprachen
  false,
  'latin',
  '["Lateinisch"]'::jsonb,
  35
) ON CONFLICT (code) DO NOTHING;

-- Spanisch (Spanish)
INSERT INTO subjects (id, name, description, category_id, is_core_subject, code, aliases, display_order)
VALUES (
  gen_random_uuid()::text,
  '{"de": "Spanisch", "en": "Spanish", "fr": "Espagnol", "it": "Spagnolo", "es": "Español", "ru": "Испанский"}'::jsonb,
  '{"de": "Spanische Sprache", "en": "Spanish language"}'::jsonb,
  '6c8be022-9c75-4b23-998b-3562d547cebe', -- Sprachen
  false,
  'spanish',
  '[]'::jsonb,
  36
) ON CONFLICT (code) DO NOTHING;

-- Theater / Darstellendes Spiel — performing arts at Berlin Gymnasium
INSERT INTO subjects (id, name, description, category_id, is_core_subject, code, aliases, display_order)
VALUES (
  gen_random_uuid()::text,
  '{"de": "Theater", "en": "Drama", "fr": "Théâtre", "it": "Teatro", "es": "Teatro", "ru": "Театр"}'::jsonb,
  '{"de": "Darstellendes Spiel / Theater", "en": "Performing arts / Drama"}'::jsonb,
  '2a025c9d-086a-46d8-979c-5dbae8453138', -- Kunst & Musik
  false,
  'drama',
  '["Darstellendes Spiel", "DS", "Theaterspiel", "Darst. Spiel"]'::jsonb,
  37
) ON CONFLICT (code) DO NOTHING;

-- Philosophie — optional at some Gymnasium
INSERT INTO subjects (id, name, description, category_id, is_core_subject, code, aliases, display_order)
VALUES (
  gen_random_uuid()::text,
  '{"de": "Philosophie", "en": "Philosophy", "fr": "Philosophie", "it": "Filosofia", "es": "Filosofía", "ru": "Философия"}'::jsonb,
  '{"de": "Philosophie", "en": "Philosophy"}'::jsonb,
  'fb67b962-9cf2-4859-8de7-7701cbf17efa', -- Sozial- & Geisteswissenschaften
  false,
  'philosophy',
  '["Praktische Philosophie"]'::jsonb,
  38
) ON CONFLICT (code) DO NOTHING;
