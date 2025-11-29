-- ============================================================================
-- MANUAL DATABASE RESET SCRIPT
-- Run this in Supabase Dashboard → SQL Editor to reset the database
-- WARNING: This will delete ALL data in the public schema
-- ============================================================================

-- Drop all policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I CASCADE', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Drop all triggers (except auth triggers)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public') LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I CASCADE', r.trigger_name, r.event_object_table);
    END LOOP;
END $$;

-- Drop auth trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;

-- Drop all functions
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT DISTINCT routine_name
        FROM information_schema.routines
        WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'
    ) LOOP
        BEGIN
            EXECUTE format('DROP FUNCTION IF EXISTS public.%I CASCADE', r.routine_name);
        EXCEPTION WHEN OTHERS THEN
            -- Ignore errors if function has overloads
            NULL;
        END;
    END LOOP;
END $$;

-- Drop all tables in public schema
DROP TABLE IF EXISTS public.verification_codes CASCADE;
DROP TABLE IF EXISTS public.security_events CASCADE;
DROP TABLE IF EXISTS public.rate_limit_tracking CASCADE;
DROP TABLE IF EXISTS public.parent_child_relationships CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.languages CASCADE;

-- Drop old/incorrect tables if they exist
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.grade_systems CASCADE;
DROP TABLE IF EXISTS public.subject_categories CASCADE;
DROP TABLE IF EXISTS public.subjects CASCADE;
DROP TABLE IF EXISTS public.bonus_factors CASCADE;
DROP TABLE IF EXISTS public.term_grades CASCADE;
DROP TABLE IF EXISTS public.subject_grades CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.translations CASCADE;

-- Also drop any tables from partially run migrations
DROP TABLE IF EXISTS public.verification_codes CASCADE;
DROP TABLE IF EXISTS public.security_events CASCADE;
DROP TABLE IF EXISTS public.rate_limit_tracking CASCADE;
DROP TABLE IF EXISTS public.parent_child_relationships CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.languages CASCADE;

-- Drop all custom types
DROP TYPE IF EXISTS verification_purpose CASCADE;
DROP TYPE IF EXISTS text_direction CASCADE;
DROP TYPE IF EXISTS rate_limit_action CASCADE;
DROP TYPE IF EXISTS event_severity CASCADE;
DROP TYPE IF EXISTS security_event_type CASCADE;
DROP TYPE IF EXISTS invitation_status CASCADE;
DROP TYPE IF EXISTS relationship_type CASCADE;
DROP TYPE IF EXISTS theme_preference CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Clean up migration history to prevent conflicts (if table exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'supabase_migrations'
        AND table_name = 'schema_migrations'
    ) THEN
        TRUNCATE TABLE supabase_migrations.schema_migrations;
    END IF;
END $$;

-- ============================================================================
-- RESET COMPLETE
-- ============================================================================
-- Next step: Run your migrations in order:
-- 1. Go to Database → Migrations in Supabase Dashboard
-- 2. Your migrations should auto-detect and run, or
-- 3. Use the SQL Editor to run each migration file in order:
--    - 20250119_001_auth_foundation.sql
--    - 20250119_002_relationships.sql
--    - 20250119_003_security.sql
--    - 20250119_004_seed_languages.sql
--    - 20250119_005_verification_codes.sql
-- ============================================================================
