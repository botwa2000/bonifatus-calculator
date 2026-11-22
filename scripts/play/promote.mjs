// Roll out an already-uploaded Android build (by versionCode) to a Play track.
// Used by .github/workflows/play-promote.yml; reads the release service account
// from PLAY_RELEASE_SA_JSON and release notes from mobile/store/play-whatsnew.
//   node scripts/play/promote.mjs <versionCode> <track>
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const [versionCode, track] = process.argv.slice(2)
if (!/^\d+$/.test(versionCode || '') || !track) {
  console.error('usage: promote.mjs <versionCode> <track>')
  process.exit(2)
}
const PKG = 'com.bonifatus.app'
const NOTES_DIR = 'mobile/store/play-whatsnew'
const sa = JSON.parse(process.env.PLAY_RELEASE_SA_JSON)

function rs256(payload) {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
  const input = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64(payload)}`
  return `${input}.${crypto.sign('sha256', Buffer.from(input), sa.private_key).toString('base64url')}`
}

async function call(method, url, token, body) {
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  if (res.status >= 300) throw new Error(`${method} ${url.split('?')[0]} -> HTTP ${res.status} ${text}`)
  return text ? JSON.parse(text) : null
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

const base = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PKG}/edits`
const describe = (t) =>
  (t.releases || []).map((r) => `${r.versionCodes} ${r.status}${r.userFraction ? ` ${r.userFraction}` : ''}`).join(' | ') || '(empty)'

const edit = await call('POST', base, token, {})
let committed = false
try {
  const before = await call('GET', `${base}/${edit.id}/tracks/${track}`, token)
  console.log(`${track} before: ${describe(before)}`)
  const bundles = await call('GET', `${base}/${edit.id}/bundles`, token)
  if (!(bundles.bundles || []).some((b) => String(b.versionCode) === versionCode)) {
    throw new Error(`versionCode ${versionCode} is not uploaded to Play`)
  }
  const releaseNotes = fs
    .readdirSync(NOTES_DIR)
    .filter((f) => f.startsWith('whatsnew-'))
    .map((f) => ({
      language: f.slice('whatsnew-'.length),
      text: fs.readFileSync(path.join(NOTES_DIR, f), 'utf8').trim(),
    }))
  await call('PUT', `${base}/${edit.id}/tracks/${track}`, token, {
    track,
    releases: [{ versionCodes: [versionCode], status: 'completed', releaseNotes }],
  })
  await call('POST', `${base}/${edit.id}:validate`, token)
  await call('POST', `${base}/${edit.id}:commit`, token)
  committed = true
  console.log(`committed: ${versionCode} rolled out to ${track} (${releaseNotes.length} release-note languages)`)
} finally {
  if (!committed) await call('DELETE', `${base}/${edit.id}`, token).catch(() => {})
}

const check = await call('POST', base, token, {})
const after = await call('GET', `${base}/${check.id}/tracks/${track}`, token)
console.log(`${track} after: ${describe(after)}`)
await call('DELETE', `${base}/${check.id}`, token)
