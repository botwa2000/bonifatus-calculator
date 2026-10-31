/**
 * Which accounts are not real users (stats_account_class, migration 0024).
 *
 * Automatic rules, re-evaluated before the dashboard loads (at most every
 * 5 minutes); they never touch a manual decision from the dashboard:
 *   test      Firebase Test Lab robots (@cloudtestlabaccounts.com), obvious
 *             test addresses ("test" in the name, example.com)
 *   review    the App Review demo account(s) from App Store Connect, and Google
 *             Play reviewers (firstnamelastname.12345@gmail.com)
 *   internal  the team: any address whose name matches a STATS_ADMIN_EMAILS
 *             address (dots and +tags ignored, any domain), and every account
 *             linked in a family to such an account
 * class 'real' exists only as a manual override that keeps an account counted.
 */
import { pool } from '@/lib/db/client'

export const CLASSES = ['internal', 'review', 'test', 'real'] as const
export type AccountClass = (typeof CLASSES)[number]

const REFRESH_MS = 5 * 60_000
let lastRun = 0

/** Local part without dots and +tag: "Alexander.Perel+max@x" → "alexanderperel". */
export const normLocal = (email: string) =>
  email.trim().toLowerCase().split('@')[0].replace(/\+.*$/, '').replace(/\./g, '')

function teamLocals(): string[] {
  return (process.env.STATS_ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim())
    .filter((e) => e.includes('@'))
    .map(normLocal)
}

async function reviewAccounts(): Promise<string[]> {
  const { rows } = await pool.query(`SELECT value FROM stats_config WHERE key = 'review_accounts'`)
  try {
    return (JSON.parse(rows[0]?.value || '[]') as string[]).map((e) => e.toLowerCase())
  } catch {
    return []
  }
}

export async function autoClassify(force = false): Promise<void> {
  if (!force && Date.now() - lastRun < REFRESH_MS) return
  lastRun = Date.now()
  const params = [teamLocals(), await reviewAccounts()]
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(
      `CREATE TEMP TABLE auto_class ON COMMIT DROP AS
       WITH base AS (
         SELECT u.id, lower(u.email) AS email, split_part(lower(u.email), '@', 2) AS domain,
                replace(regexp_replace(split_part(lower(u.email), '@', 1), '\\+.*$', ''), '.', '') AS local
           FROM users u JOIN user_profiles p ON p.id = u.id
          WHERE p.role <> 'admin' AND u.email IS NOT NULL
       ), direct AS (
         SELECT id, CASE
             WHEN domain = 'cloudtestlabaccounts.com'        THEN 'test'
             WHEN email = ANY($2::text[])                     THEN 'review'
             WHEN email ~ '^[a-z]+\\.[0-9]{5}@gmail\\.com$'   THEN 'review'
             WHEN local = ANY($1::text[])                     THEN 'internal'
             WHEN domain IN ('example.com', 'example.org') OR local LIKE '%test%' THEN 'test'
           END AS class,
           CASE
             WHEN domain = 'cloudtestlabaccounts.com'        THEN 'Firebase Test Lab robot'
             WHEN email = ANY($2::text[])                     THEN 'App Review demo account'
             WHEN email ~ '^[a-z]+\\.[0-9]{5}@gmail\\.com$'   THEN 'Google Play reviewer pattern'
             WHEN local = ANY($1::text[])                     THEN 'team address'
             ELSE 'test address'
           END AS reason
           FROM base
       )
       SELECT id, class, reason FROM direct WHERE class IS NOT NULL
       UNION
       SELECT CASE WHEN r.parent_id = d.id THEN r.child_id ELSE r.parent_id END, 'internal', 'family of a team account'
         FROM parent_child_relationships r
         JOIN direct d ON d.class = 'internal' AND (r.parent_id = d.id OR r.child_id = d.id)
        WHERE r.invitation_status = 'accepted'`,
      params
    )
    // One row per account: a direct rule wins over the family link.
    await client.query(
      `DELETE FROM auto_class a USING auto_class b
        WHERE a.id = b.id AND a.reason = 'family of a team account' AND b.reason <> a.reason`
    )
    await client.query(
      `INSERT INTO stats_account_class (user_id, class, reason, manual, updated_at)
       SELECT DISTINCT ON (id) id, class, reason, false, NOW() FROM auto_class WHERE id IS NOT NULL
       ON CONFLICT (user_id) DO UPDATE
         SET class = EXCLUDED.class, reason = EXCLUDED.reason, updated_at = NOW()
         WHERE NOT stats_account_class.manual
           AND (stats_account_class.class, stats_account_class.reason) IS DISTINCT FROM (EXCLUDED.class, EXCLUDED.reason)`
    )
    await client.query(
      `DELETE FROM stats_account_class c
        WHERE NOT c.manual AND NOT EXISTS (SELECT 1 FROM auto_class a WHERE a.id = c.user_id)`
    )
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    lastRun = 0
    throw err
  } finally {
    client.release()
  }
}

/** Manual decision from the dashboard; 'auto' removes it and lets the rules decide. */
export async function setAccountClass(
  email: string,
  cls: AccountClass | 'auto'
): Promise<'ok' | 'not_found'> {
  const { rows } = await pool.query(`SELECT id FROM users WHERE lower(email) = lower($1)`, [
    email.trim(),
  ])
  if (!rows[0]) return 'not_found'
  if (cls === 'auto') {
    await pool.query(`DELETE FROM stats_account_class WHERE user_id = $1`, [rows[0].id])
  } else {
    await pool.query(
      `INSERT INTO stats_account_class (user_id, class, reason, manual, updated_at)
       VALUES ($1, $2, 'set on the dashboard', true, NOW())
       ON CONFLICT (user_id) DO UPDATE
         SET class = EXCLUDED.class, reason = EXCLUDED.reason, manual = true, updated_at = NOW()`,
      [rows[0].id, cls]
    )
  }
  await autoClassify(true)
  return 'ok'
}

/** Every classified account, for the dashboard's "Not counted" list. */
export async function listClassified() {
  const { rows } = await pool.query(
    `SELECT u.email, p.role, c.class, c.reason, c.manual, p.created_at::date::text AS created
       FROM stats_account_class c
       JOIN users u ON u.id = c.user_id
       JOIN user_profiles p ON p.id = c.user_id
      ORDER BY c.class, p.created_at`
  )
  return rows as {
    email: string
    role: string
    class: AccountClass
    reason: string
    manual: boolean
    created: string
  }[]
}
