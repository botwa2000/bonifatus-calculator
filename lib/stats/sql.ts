/**
 * SQL helpers shared by the /admin/stats aggregations (aggregate.ts, behaviour.ts).
 */
import { pool } from '@/lib/db/client'

// Real users only (views from migration 0024) or every row (raw tables).
export const TABLE_NAMES = [
  'usage_events',
  'action_log',
  'usage_installs',
  'feedback',
  'user_profiles',
  'quick_grades',
  'term_grades',
  'subject_grades',
  'settlements',
  'parent_child_relationships',
  'parent_child_invites',
] as const
export type Tables = Record<(typeof TABLE_NAMES)[number], string>
export const tablesFor = (traffic: 'real' | 'all') =>
  Object.fromEntries(
    TABLE_NAMES.map((n) => [n, traffic === 'real' ? `stats_real_${n}` : n])
  ) as Tables

export const int = (v: unknown) => Number(v || 0)
export const q = async <T = Record<string, unknown>>(text: string, params: unknown[] = []) =>
  (await pool.query(text, params)).rows as T[]
export type Row = Record<string, unknown>

/** Same day expression everywhere, truncated to the bucket held in parameter $n. */
export const per = (col: string, n: number) =>
  `date_trunc($${n}, (${col} AT TIME ZONE 'UTC')::date::timestamp)::date::text`

/** Platform filter on parameter $3: all | web | ios | android. */
export const P = `($3 = 'all' OR platform = $3)`

// One person = one id: the account when known — also for that account's
// devices before sign-in (usage_installs.user_id) — else install, else visitor hash.
export const uid = (t: string) =>
  `COALESCE(${t}.user_id, (SELECT i.user_id FROM usage_installs i WHERE i.install_id = ${t}.install_id), ${t}.install_id, ${t}.visitor_hash)`
