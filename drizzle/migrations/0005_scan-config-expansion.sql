-- Move all hardcoded scanner values to the scan_config table
-- Each key stores a JSONB value: arrays, objects, or maps

-- OCR character substitution pairs: [[wrong, correct], ...]
INSERT INTO scan_config (key, data) VALUES
('ocr_substitutions', '[["rn","m"],["m","rn"],["vv","w"],["l","I"],["I","l"],["0","O"],["O","0"],["|","l"],["1","l"],["5","S"],["S","5"],["8","B"],["ii","ü"],["ue","ü"],["ae","ä"],["oe","ö"],["ss","ß"]]'::jsonb)
ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data;

-- Umlaut/accent normalization map: {char: replacement}
INSERT INTO scan_config (key, data) VALUES
('umlaut_map', '{"ä":"a","ö":"o","ü":"u","Ä":"A","Ö":"O","Ü":"U","ß":"ss","é":"e","è":"e","ê":"e","ë":"e","à":"a","â":"a","ù":"u","û":"u","î":"i","ï":"i","ô":"o","ñ":"n","ç":"c"}'::jsonb)
ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data;

-- School type keywords for heuristic school name detection
INSERT INTO scan_config (key, data) VALUES
('school_type_keywords', '["grundschule","volksschule","gymnasium","realschule","hauptschule","gesamtschule","oberschule","mittelschule","förderschule","college","colegio","liceo","instituto","lycée","collège","école","scuola","school","academy","escuela","школа","гимназия","лицей"]'::jsonb)
ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data;

-- Term type keywords: {keyword: termType}
INSERT INTO scan_config (key, data) VALUES
('term_keywords', '{
  "jahreszeugnis":"final","halbjahreszeugnis":"semester","zwischenzeugnis":"midterm",
  "abschlusszeugnis":"final","versetzungszeugnis":"final","zeugnis der allgemeinen hochschulreife":"final",
  "bulletin annuel":"final","bulletin semestriel":"semester","bulletin trimestriel":"quarterly",
  "final report":"final","end of year":"final","mid-term":"midterm","mid term":"midterm",
  "midterm":"midterm","semester":"semester","quarterly":"quarterly","annual report":"final",
  "pagella":"final","pagella finale":"final","scheda di valutazione":"final",
  "primo quadrimestre":"semester","secondo quadrimestre":"final",
  "boletín final":"final","boletín trimestral":"quarterly",
  "calificaciones finales":"final","evaluación trimestral":"quarterly",
  "годовая оценка":"final","годовая":"final","четвертная оценка":"quarterly",
  "четвертная":"quarterly","полугодовая":"semester","итоговая аттестация":"final","аттестат":"final"
}'::jsonb)
ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data;

-- Month names in multiple languages: {monthName: "01"-"12"}
INSERT INTO scan_config (key, data) VALUES
('month_names', '{
  "januar":"01","februar":"02","märz":"03","april":"04","mai":"05","juni":"06",
  "juli":"07","august":"08","september":"09","oktober":"10","november":"11","dezember":"12",
  "janvier":"01","février":"02","mars":"03","avril":"04","juin":"06","juillet":"07",
  "août":"08","septembre":"09","octobre":"10","novembre":"11","décembre":"12",
  "enero":"01","febrero":"02","marzo":"03","mayo":"05","junio":"06","julio":"07",
  "agosto":"08","septiembre":"09","noviembre":"11","diciembre":"12",
  "gennaio":"01","febbraio":"02","aprile":"04","maggio":"05","giugno":"06","luglio":"07",
  "settembre":"09","ottobre":"10",
  "january":"01","february":"02","march":"03","may":"05","june":"06","july":"07",
  "october":"10","december":"12"
}'::jsonb)
ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data;

-- Labels that precede student name on report cards
INSERT INTO scan_config (key, data) VALUES
('student_name_labels', '["Vor- und Zuname","Vor-und Zuname","Vor- u. Zuname","Vorname","Name","Student","Schüler","Schülerin","Élève","Aluno","Alumno","Ученик","Nom","Apellido","Фамилия","Имя"]'::jsonb)
ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data;

-- Labels that precede school name on report cards
INSERT INTO scan_config (key, data) VALUES
('school_name_labels', '["Schule","School","École","Scuola","Escuela","Школа","Gymnasium","Realschule","Hauptschule","Gesamtschule","Lycée","Instituto","Colegio","College","Liceo"]'::jsonb)
ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data;

-- Locale to Tesseract language codes
INSERT INTO scan_config (key, data) VALUES
('locale_languages', '{"de":"deu+eng","en":"eng","fr":"fra+eng","it":"ita+eng","es":"spa+eng","ru":"rus+eng"}'::jsonb)
ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data;

-- Country code to Tesseract language codes
INSERT INTO scan_config (key, data) VALUES
('country_languages', '{"DE":"deu+eng","AT":"deu+eng","CH":"deu+fra+ita+eng","US":"eng","GB":"eng","FR":"fra+eng","IT":"ita+eng","ES":"spa+eng","CA":"eng+fra","BR":"por+eng","JP":"jpn+eng","AU":"eng","IN":"eng+hin","NL":"nld+eng","RU":"rus+eng"}'::jsonb)
ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data;

-- Supported locales for subject name matching
INSERT INTO scan_config (key, data) VALUES
('supported_locales', '["en","de","fr","it","es","ru"]'::jsonb)
ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data;
