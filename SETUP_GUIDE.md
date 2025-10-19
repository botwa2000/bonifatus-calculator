# Bonifatus Setup Guide

## ✅ Completed Steps

- [x] Database migrations created (5 files)
- [x] Backend services implemented (8 files)
- [x] API routes created (3 endpoints)
- [x] Environment variables configured
- [x] NPM packages installed (`nodemailer`, `zod`)

---

## 🚀 Next Steps to Complete Setup

### Step 1: Apply Database Migrations

You need to run the SQL migration files in your Supabase database.

**Method 1: Via Supabase Dashboard (Recommended)**

1. Go to: https://app.supabase.com/project/qvbeleouvaknbhnztmgf/sql/new
2. Run each migration file in order:

   **Migration 1: Auth Foundation**
   - Copy contents of `supabase/migrations/20250119_001_auth_foundation.sql`
   - Paste into SQL Editor
   - Click **RUN**

   **Migration 2: Relationships**
   - Copy contents of `supabase/migrations/20250119_002_relationships.sql`
   - Paste into SQL Editor
   - Click **RUN**

   **Migration 3: Security**
   - Copy contents of `supabase/migrations/20250119_003_security.sql`
   - Paste into SQL Editor
   - Click **RUN**

   **Migration 4: Languages**
   - Copy contents of `supabase/migrations/20250119_004_seed_languages.sql`
   - Paste into SQL Editor
   - Click **RUN**

   **Migration 5: Verification Codes**
   - Copy contents of `supabase/migrations/20250119_005_verification_codes.sql`
   - Paste into SQL Editor
   - Click **RUN**

**Method 2: Via Supabase CLI (Alternative)**

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref qvbeleouvaknbhnztmgf

# Push migrations
supabase db push
```

### Step 2: Verify Database Setup

After running migrations, verify in Supabase Dashboard:

1. Go to: https://app.supabase.com/project/qvbeleouvaknbhnztmgf/database/tables
2. Check that these tables exist:
   - ✅ `user_profiles`
   - ✅ `parent_child_relationships`
   - ✅ `security_events`
   - ✅ `rate_limit_tracking`
   - ✅ `languages`
   - ✅ `verification_codes`

### Step 3: Configure Supabase Auth Settings

1. Go to: https://app.supabase.com/project/qvbeleouvaknbhnztmgf/auth/providers
2. **Email Provider**:
   - Ensure "Enable Email Signup" is ON
   - Disable "Confirm email" (we handle this with our own 6-digit codes)
   - Enable "Secure email change"

3. **OAuth Providers** (Configure later):
   - Google: Add Client ID and Secret
   - Microsoft: Add Client ID and Secret

### Step 4: Test Email Service (Optional)

Create a test script to verify email sending works:

```typescript
// test-email.ts
import { sendEmail } from './lib/email/service'

async function testEmail() {
  const result = await sendEmail({
    to: 'your-email@example.com',
    subject: 'Test Email from Bonifatus',
    text: 'This is a test email',
    html: '<p>This is a test email</p>',
  })

  console.log('Email sent:', result)
}

testEmail()
```

Run: `npx tsx test-email.ts`

### Step 5: Add Environment Variables to Vercel (For Production)

When ready to deploy to production:

1. Go to: https://vercel.com/your-username/bonifatus-calculator/settings/environment-variables

2. Add these variables for **Production** environment:

| Variable                         | Value                                 |
| -------------------------------- | ------------------------------------- |
| `NEXT_PUBLIC_APP_URL`            | `https://bonifatus.com`               |
| `EMAIL_HOST`                     | `mx2eed.netcup.net`                   |
| `EMAIL_PORT`                     | `465`                                 |
| `EMAIL_SECURE`                   | `true`                                |
| `EMAIL_USER`                     | `no-reply@bonifatus.com`              |
| `EMAIL_PASSWORD`                 | `j5a4kAFf8VxCfQf!`                    |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | `0x4AAAAAAB7cH7pweCPsYnpL`            |
| `TURNSTILE_SECRET_KEY`           | `0x4AAAAAAB7cH4XmMpy-1OREIPI2uRg2QY4` |

(Supabase variables should already be configured)

3. Redeploy after adding variables

---

## 📋 What's Next After Setup

Once database migrations are applied, we can:

1. **Create TypeScript type definitions** for the database
2. **Build registration UI** with:
   - Password strength indicator
   - Real-time validation
   - Cloudflare Turnstile integration
3. **Build verification page** with:
   - 6-digit code input
   - Countdown timer
   - Resend code functionality

---

## 🔍 Troubleshooting

### Migration Errors

**Error: "relation already exists"**

- Some tables may already exist from previous setup
- Safe to ignore or drop tables first: `DROP TABLE IF EXISTS table_name CASCADE;`

**Error: "function already exists"**

- Add `OR REPLACE` to function definitions
- Or drop first: `DROP FUNCTION IF EXISTS function_name;`

### Email Sending Errors

**Error: "SMTP connection failed"**

- Verify EMAIL\_\* variables are set correctly
- Check EMAIL_PORT is `465` (not `587`)
- Verify EMAIL_SECURE is `true`

**Error: "Authentication failed"**

- Double-check EMAIL_PASSWORD is correct
- Ensure no extra spaces in .env.local

### Turnstile Errors

**Error: "Invalid site key"**

- Verify NEXT_PUBLIC_TURNSTILE_SITE_KEY is correct
- Check site is configured for your domain in Cloudflare dashboard

---

## Current Environment Configuration

Your `.env.local` is configured with:

✅ Supabase connection
✅ Email credentials (Netcup SMTP)
✅ Cloudflare Turnstile keys

**Next:** Run database migrations to create all tables and functions.
