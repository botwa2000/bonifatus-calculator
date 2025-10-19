# Apply Database Migrations to Supabase

## Quick Method (Recommended)

### Option 1: Via Supabase Dashboard

1. **Open Supabase SQL Editor:**
   - Go to: https://app.supabase.com/project/qvbeleouvaknbhnztmgf/sql/new

2. **Copy the combined migration:**
   - Open file: `supabase/migrations/combined_migration.sql`
   - Copy ALL content (Ctrl+A, Ctrl+C)

3. **Paste and Run:**
   - Paste into SQL Editor
   - Click **RUN** button
   - Wait for "Success" message

4. **Verify tables created:**
   - Go to: https://app.supabase.com/project/qvbeleouvaknbhnztmgf/database/tables
   - Check that these tables exist:
     - ✅ user_profiles
     - ✅ parent_child_relationships
     - ✅ security_events
     - ✅ rate_limit_tracking
     - ✅ languages
     - ✅ verification_codes

---

### Option 2: Via Supabase CLI (If you have it installed)

```bash
# Install CLI globally (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref qvbeleouvaknbhnztmgf

# Push all migrations
supabase db push
```

---

## If You Get Errors

### Error: "relation already exists"

Some tables might exist from previous setup. Run this first to clean up:

```sql
-- Drop existing tables (if any)
DROP TABLE IF EXISTS verification_codes CASCADE;
DROP TABLE IF EXISTS security_events CASCADE;
DROP TABLE IF EXISTS rate_limit_tracking CASCADE;
DROP TABLE IF EXISTS parent_child_relationships CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS languages CASCADE;

-- Drop existing types (if any)
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS theme_preference CASCADE;
DROP TYPE IF EXISTS relationship_type CASCADE;
DROP TYPE IF EXISTS invitation_status CASCADE;
DROP TYPE IF EXISTS security_event_type CASCADE;
DROP TYPE IF EXISTS event_severity CASCADE;
DROP TYPE IF EXISTS rate_limit_action CASCADE;
DROP TYPE IF EXISTS text_direction CASCADE;
DROP TYPE IF EXISTS verification_purpose CASCADE;

-- Now run the combined_migration.sql
```

---

## After Migrations Applied Successfully

You should see these tables in Supabase:

| Table                      | Description                      |
| -------------------------- | -------------------------------- |
| user_profiles              | Extended user information        |
| parent_child_relationships | Links parents to children        |
| security_events            | Security monitoring logs         |
| rate_limit_tracking        | Rate limiting state              |
| languages                  | Supported languages (EN, DE, FR) |
| verification_codes         | 6-digit email codes              |

---

## Next Steps After Migration

Once migrations are applied, we can:

1. ✅ Test database connection from app
2. ✅ Commit code to GitHub
3. ✅ Push to trigger Vercel deployment
4. ✅ Add environment variables to Vercel
5. ✅ Test registration flow

---

## Need Help?

If you encounter any errors, let me know and I'll help troubleshoot!
