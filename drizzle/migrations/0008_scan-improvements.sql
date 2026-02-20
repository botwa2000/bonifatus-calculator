-- Improve scan parsing for German report card formats (Schul Z 300, etc.)

-- Add section headers and table headers to skip_keywords so they don't get parsed as subjects
UPDATE scan_config SET data = data || '["pflichtunterricht", "wahlpflichtunterricht", "wahlunterricht", "pflichtfächer", "wahlfächer", "wahlpflichtfächer", "fach", "fächer", "punkte", "note", "noten", "leistungen", "leistungsbewertung", "lernbereich", "unterrichtsfach", "unterrichtsfächer", "schriftlich", "mündlich"]'::jsonb
WHERE key = 'skip_keywords';

-- Add "zeugnis" as a term keyword → semester_2 (end of year report)
UPDATE scan_config SET data = data || '{"zeugnis": "semester_2"}'::jsonb
WHERE key = 'term_keywords';

-- Add Informatik alias (common OCR variant)
UPDATE subjects SET aliases = aliases || '["Informatik"]'::jsonb
WHERE name->>'de' = 'Informatik' AND NOT aliases @> '"Informatik"';

-- If Informatik doesn't exist as a subject, it's likely matched via the DB already.
-- But ensure Musik and Kunst have their common aliases
UPDATE subjects SET aliases = aliases || '["Bildende Kunst", "Kunsterziehung"]'::jsonb
WHERE name->>'de' = 'Kunst' AND NOT aliases @> '"Bildende Kunst"';

UPDATE subjects SET aliases = aliases || '["Musiklehre", "Musikunterricht"]'::jsonb
WHERE name->>'de' = 'Musik' AND NOT aliases @> '"Musiklehre"';

-- Add Darstellendes Spiel / Theater alias
UPDATE subjects SET aliases = aliases || '["Darstellendes Spiel", "Theater", "DS"]'::jsonb
WHERE name->>'de' = 'Theater/Drama' AND NOT aliases @> '"Darstellendes Spiel"';

-- Add common Berlin Gymnasium subjects that may be missing
-- Politikwissenschaft (Berlin name) → Sozialkunde
UPDATE subjects SET aliases = aliases || '["Politikwissenschaft", "Politische Bildung", "PW"]'::jsonb
WHERE name->>'de' = 'Sozialkunde' AND NOT aliases @> '"Politikwissenschaft"';

-- Wirtschaft, Arbeit, Technik (WAT) — Berlin Gymnasium subject
UPDATE subjects SET aliases = aliases || '["Wirtschaft, Arbeit, Technik", "WAT", "Wirtschaft-Arbeit-Technik"]'::jsonb
WHERE name->>'de' = 'Hauswirtschaft' AND NOT aliases @> '"WAT"';
