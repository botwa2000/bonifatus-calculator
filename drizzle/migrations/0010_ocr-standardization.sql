-- Move remaining hardcoded OCR parsing patterns to scan_config for multilingual support

-- Class level keywords: replaces hardcoded Klasse|Classe|Class|... regex
INSERT INTO scan_config (key, data) VALUES
('class_level_keywords', '["Klasse","Classe","Class","Grade","Grado","Класс","Stufe","Jahrgangsstufe","Nivel","Année","Cours","Уровень"]'::jsonb)
ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data;

-- Name prefix patterns: replaces hardcoded Berlin "für...geboren" pattern
-- Each entry has a prefix regex and suffix regex with a Unicode name capture group between them
INSERT INTO scan_config (key, data) VALUES
('name_prefix_patterns', '[
  {"prefix": "f[üuia]{1,2}r", "suffix": "geboren"},
  {"prefix": "pour", "suffix": "n[ée]+e?"},
  {"prefix": "para", "suffix": "nacid[oa]"},
  {"prefix": "per", "suffix": "nat[oa]"},
  {"prefix": "for", "suffix": "born"},
  {"prefix": "для", "suffix": "рождённ[аыйое]{0,2}"}
]'::jsonb)
ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data;

-- School name previous-line labels: when the current line matches one of these,
-- the previous line is used as the school name
INSERT INTO scan_config (key, data) VALUES
('school_name_prev_line_labels', '["Name der Schule","Nom de l''école","School Name","Nombre de la escuela","Nome della scuola","Название школы"]'::jsonb)
ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data;
