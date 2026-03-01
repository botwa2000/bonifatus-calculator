import { readFileSync } from 'fs'
import { resolve } from 'path'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

// Load .env.local manually
const envPath = resolve(__dirname, '..', '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eqIdx = trimmed.indexOf('=')
  if (eqIdx === -1) continue
  const key = trimmed.slice(0, eqIdx)
  const val = trimmed.slice(eqIdx + 1)
  if (!process.env[key]) process.env[key] = val
}

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const db = drizzle(pool)

  console.log('Running migration 0016: class-level-equals-class-number...')

  // Update class level factors: factor = class number
  for (let i = 1; i <= 13; i++) {
    await db.execute(
      sql`UPDATE bonus_factor_defaults SET factor_value = ${i} WHERE factor_type = 'class_level' AND factor_key = ${`class_${i}`}`
    )
    console.log(`  class_${i} = ${i}`)
  }

  // Add settlement columns to subject_grades
  console.log('Adding settlement columns to subject_grades...')
  await db.execute(
    sql`ALTER TABLE subject_grades ADD COLUMN IF NOT EXISTS settlement_status text DEFAULT 'unsettled' NOT NULL`
  )
  await db.execute(
    sql`ALTER TABLE subject_grades ADD COLUMN IF NOT EXISTS settlement_id text REFERENCES settlements(id) ON DELETE SET NULL`
  )

  // Verify
  const result = await db.execute(
    sql`SELECT factor_key, factor_value FROM bonus_factor_defaults WHERE factor_type = 'class_level' ORDER BY factor_key`
  )
  console.log('Updated factors:')
  for (const row of result.rows) {
    const r = row as Record<string, unknown>
    console.log(`  ${r.factor_key} = ${r.factor_value}`)
  }

  console.log('Migration 0016 complete.')
  await pool.end()
  process.exit(0)
}

run().catch((e) => {
  console.error('Migration failed:', e)
  process.exit(1)
})
