// Publish one Play store listing language (texts + phone screenshots) from the repo.
// Used by .github/workflows/play-listing.yml; reads the release service account from
// PLAY_RELEASE_SA_JSON. Committing the edit sends the listing to Google's review.
//   node scripts/play/listing.mjs <language> <screenshotsDir|-> [--dry-run]
// Texts: mobile/store/play-listing/<language>/{title,short_description,full_description}.txt
// Screenshots: every *.png in <screenshotsDir>, in name order, replacing the current set
// ("-" leaves the screenshots as they are).
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const [language, shotsDir, flag] = process.argv.slice(2)
const dryRun = flag === '--dry-run'
if (!/^[a-z]{2}(-[A-Z]{2})?$/.test(language || '') || !shotsDir) {
  console.error('usage: listing.mjs <language> <screenshotsDir|-> [--dry-run]')
  process.exit(2)
}
const PKG = 'com.bonifatus.app'
const LIMITS = { title: 30, short_description: 80, full_description: 4000 }
const dir = path.join('mobile/store/play-listing', language)
const text = Object.fromEntries(
  Object.entries(LIMITS).map(([name, max]) => {
    const v = fs.readFileSync(path.join(dir, `${name}.txt`), 'utf8').replace(/\r/g, '').trim()
    // Play counts characters (code points), not bytes.
    if (!v || [...v].length > max) throw new Error(`${name}: ${[...v].length} characters, limit ${max}`)
    return [name, v]
  })
)
const shots =
  shotsDir === '-'
    ? []
    : fs.readdirSync(shotsDir).filter((f) => f.endsWith('.png')).sort().map((f) => path.join(shotsDir, f))
if (shotsDir !== '-' && (shots.length < 2 || shots.length > 8))
  throw new Error(`Play needs 2–8 phone screenshots, found ${shots.length} in ${shotsDir}`)

const sa = JSON.parse(process.env.PLAY_RELEASE_SA_JSON)
function rs256(payload) {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
  const input = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64(payload)}`
  return `${input}.${crypto.sign('sha256', Buffer.from(input), sa.private_key).toString('base64url')}`
}
const now = Math.floor(Date.now() / 1000)
const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  body: new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: rs256({
      iss: sa.client_email,
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
      scope: 'https://www.googleapis.com/auth/androidpublisher',
    }),
  }),
})
const token = (await tokenRes.json()).access_token
if (!token) throw new Error(`Google OAuth failed: HTTP ${tokenRes.status}`)
console.log(`service account: ${sa.client_email}`)

async function call(method, url, body, contentType = 'application/json') {
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': contentType },
    body: body === undefined ? undefined : Buffer.isBuffer(body) ? body : JSON.stringify(body),
  })
  const t = await res.text()
  if (res.status >= 300) throw new Error(`${method} ${url.split('?')[0]} -> HTTP ${res.status} ${t}`)
  return t ? JSON.parse(t) : null
}

const api = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PKG}/edits`
const upload = `https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications/${PKG}/edits`
const edit = await call('POST', api, {})
let committed = false
try {
  const before = await call('GET', `${api}/${edit.id}/listings/${language}`).catch(() => null)
  console.log(`before: ${before ? `"${before.title}" / "${before.shortDescription}"` : '(no listing)'}`)
  await call('PUT', `${api}/${edit.id}/listings/${language}`, {
    language,
    title: text.title,
    shortDescription: text.short_description,
    fullDescription: text.full_description,
  })
  if (shots.length) {
    await call('DELETE', `${api}/${edit.id}/listings/${language}/phoneScreenshots`)
    for (const f of shots) {
      await call(
        'POST',
        `${upload}/${edit.id}/listings/${language}/phoneScreenshots?uploadType=media`,
        fs.readFileSync(f),
        'image/png'
      )
      console.log(`uploaded ${path.basename(f)}`)
    }
  }
  await call('POST', `${api}/${edit.id}:validate`)
  if (dryRun) {
    console.log('dry run: edit validated, not committed')
  } else {
    await call('POST', `${api}/${edit.id}:commit`)
    committed = true
    console.log(`committed: ${language} listing${shots.length ? ` + ${shots.length} screenshots` : ''}`)
  }
} finally {
  if (!committed) await call('DELETE', `${api}/${edit.id}`).catch(() => {})
}

// Read back from a fresh edit (reflects the committed state).
const check = await call('POST', api, {})
const after = await call('GET', `${api}/${check.id}/listings/${language}`)
const images = await call('GET', `${api}/${check.id}/listings/${language}/phoneScreenshots`)
console.log(`after: "${after.title}" / "${after.shortDescription}" / ${after.fullDescription.length} chars / ${(images.images || []).length} screenshots`)
await call('DELETE', `${api}/${check.id}`)
