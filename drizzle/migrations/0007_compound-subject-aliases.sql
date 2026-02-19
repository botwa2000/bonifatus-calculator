-- Add compound subject aliases for German Mittelschule subjects (PCB, GSE, AWT)
-- and Religionslehre variants

-- Physik/Chemie/Biologie (PCB) → Allgemeine Naturwissenschaften
UPDATE subjects SET aliases = aliases || '["Physik/Chemie/Biologie", "PCB", "Physik/Chemie/Bio"]'::jsonb
WHERE name->>'de' = 'Allgemeine Naturwissenschaften' AND NOT aliases @> '"Physik/Chemie/Biologie"';

-- Geschichte/Sozialkunde/Erdkunde (GSE) → Sozialkunde
UPDATE subjects SET aliases = aliases || '["Geschichte/Sozialkunde/Erdkunde", "GSE", "Geschichte/Sozialkunde"]'::jsonb
WHERE name->>'de' = 'Sozialkunde' AND NOT aliases @> '"Geschichte/Sozialkunde/Erdkunde"';

-- Arbeit-Wirtschaft-Technik (AWT) → Hauswirtschaft (closest vocational/career subject)
UPDATE subjects SET aliases = aliases || '["Arbeit-Wirtschaft-Technik", "AWT", "Wirtschaft und Technik"]'::jsonb
WHERE name->>'de' = 'Hauswirtschaft' AND NOT aliases @> '"Arbeit-Wirtschaft-Technik"';

-- Religionslehre variants → Religion/Ethik
UPDATE subjects SET aliases = aliases || '["Religionslehre (ev.)", "Religionslehre (kath.)", "Religionslehre (rk)", "Evangelische Religionslehre", "Katholische Religionslehre"]'::jsonb
WHERE name->>'de' = 'Religion/Ethik' AND NOT aliases @> '"Religionslehre (ev.)"';

-- Add Jahrgangsstufe to class level regex support via term_keywords (not needed — already works via "Stufe")
