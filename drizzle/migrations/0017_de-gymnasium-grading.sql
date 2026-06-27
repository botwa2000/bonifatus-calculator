-- Add German Gymnasium Oberstufe point scale (0-15 Punkte)
-- Used in Klassen 11-13 for Abitur preparation (bestIsHighest = true, passing = 4)
-- Secondary display: average translates to 1-6 university scale via (17 - P) / 3

INSERT INTO grading_systems (
  id, code, name, description,
  country_code, scale_type, best_is_highest,
  min_value, max_value, passing_threshold,
  grade_definitions, display_order, is_active
)
VALUES (
  gen_random_uuid(),
  'DE_GYMNASIUM',
  '{
    "de": "Gymnasiales Punktesystem (0-15)",
    "en": "German Gymnasium Points (0-15)",
    "fr": "Points Gymnasium allemand (0-15)",
    "it": "Punti Gymnasium tedesco (0-15)",
    "es": "Puntos Gymnasium aleman (0-15)",
    "ru": "Баллы немецкой гимназии (0-15)"
  }',
  '{
    "de": "Oberstufen-Punkteskala von 15 (sehr gut) bis 0 (ungenuegend). Klassen 11-13, Abitur.",
    "en": "Oberstufe point scale from 15 (very good) to 0 (insufficient). Grades 11-13, Abitur.",
    "fr": "Echelle de points Oberstufe de 15 (tres bien) a 0 (insuffisant). Classes 11-13, Abitur.",
    "it": "Scala punti Oberstufe da 15 (ottimo) a 0 (insufficiente). Classi 11-13, Abitur.",
    "es": "Escala de puntos Oberstufe de 15 (muy bueno) a 0 (insuficiente). Cursos 11-13, Abitur.",
    "ru": "Шкала баллов Обер-ступени от 15 (очень хорошо) до 0 (неудовлетворительно). 11-13 классы, Абитур."
  }',
  'DE',
  'numeric',
  true,
  0, 15, 4,
  '[
    {"grade": "15", "quality_tier": "best",   "numeric_value": 15, "normalized_100": 100},
    {"grade": "14", "quality_tier": "best",   "numeric_value": 14, "normalized_100": 93},
    {"grade": "13", "quality_tier": "best",   "numeric_value": 13, "normalized_100": 87},
    {"grade": "12", "quality_tier": "best",   "numeric_value": 12, "normalized_100": 80},
    {"grade": "11", "quality_tier": "second", "numeric_value": 11, "normalized_100": 73},
    {"grade": "10", "quality_tier": "second", "numeric_value": 10, "normalized_100": 67},
    {"grade": "9",  "quality_tier": "second", "numeric_value":  9, "normalized_100": 60},
    {"grade": "8",  "quality_tier": "second", "numeric_value":  8, "normalized_100": 53},
    {"grade": "7",  "quality_tier": "third",  "numeric_value":  7, "normalized_100": 47},
    {"grade": "6",  "quality_tier": "third",  "numeric_value":  6, "normalized_100": 40},
    {"grade": "5",  "quality_tier": "third",  "numeric_value":  5, "normalized_100": 33},
    {"grade": "4",  "quality_tier": "third",  "numeric_value":  4, "normalized_100": 27},
    {"grade": "3",  "quality_tier": "below",  "numeric_value":  3, "normalized_100": 20},
    {"grade": "2",  "quality_tier": "below",  "numeric_value":  2, "normalized_100": 13},
    {"grade": "1",  "quality_tier": "below",  "numeric_value":  1, "normalized_100":  7},
    {"grade": "0",  "quality_tier": "below",  "numeric_value":  0, "normalized_100":  0}
  ]',
  2, true
);
