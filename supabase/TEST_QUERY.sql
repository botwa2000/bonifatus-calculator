-- ============================================================================
-- CHECK TRIGGER STATUS
-- ============================================================================

-- Check if trigger exists on auth.users table
SELECT
    tgname AS trigger_name,
    tgrelid::regclass AS table_name,
    tgenabled AS enabled,
    proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'on_auth_user_created';

-- Check if the function exists
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'handle_new_user';

-- Manually test the trigger function
-- This will show us if the function works
SELECT handle_new_user();
