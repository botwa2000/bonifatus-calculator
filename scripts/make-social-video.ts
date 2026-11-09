// "Was ist fair?" — vertical video series for Instagram Reels (and TikTok / Shorts).
//
//   npx tsx scripts/make-social-video.ts            # all episodes (de)
//   npx tsx scripts/make-social-video.ts 2          # one episode
//   npx tsx scripts/make-social-video.ts --locale=de
//
// Why video: on Instagram only Reels reach people who do not already follow the account
// (measured on @lalabuba.ai: 14 feed posts, 0 % non-follower reach). Feed graphics alone
// cannot grow @bonifatus.app.
//
// FORMAT (fixed for every episode)
//   1080×1920, 30 fps, H.264 + AAC, 15–20 s, German.
//   Silent-readable: the text carries everything; the synthesised track is a bonus.
//   Frame 0 already shows the hook — autoplay is muted and the first frame is the cover.
//   Essential text stays inside SAFE (Meta's Reels guidance: keep the top 14 % and the
//   bottom 35 % clear of text — captions, username and buttons sit there).
//
// HOW AN EPISODE IS MADE
//   Copy lives in scripts/social/copy.ts under `videos` as a list of beats (hook, compare,
//   statement, stat, bars, list, end). This file turns beats into frames:
//     • every glyph is rendered by Pango from the bundled Geist TTFs (scripts/social/render.ts)
//       — never a host font, so umlauts cannot silently degrade;
//     • frames are composited in memory and piped straight into ffmpeg (no temp PNGs);
//     • each beat lasts as long as its text needs to be read (readTime below), and the
//       episode is refused if the total falls outside 15–20 s;
//     • the soundtrack is synthesised from the same beat timeline (no samples, no licences).
//
// ADDING AN EPISODE: see docs/social-content/videos/was-ist-fair/README.md.
import sharp from 'sharp'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { spawn, spawnSync } from 'child_process'
import { once } from 'events'
import {
  FONTS,
  C,
  SHADOW_PAD,
  renderText,
  renderTextFit,
  card,
  rect,
  numberMarker,
} from './social/render'
import {
  COPY,
  assertNoTransliteration,
  type Copy,
  type Locale,
  type VideoBeat,
  type VideoEpisode,
} from './social/copy'

const ROOT = path.join(__dirname, '..')
const OUT = path.join(ROOT, 'docs', 'social-content', 'videos', 'was-ist-fair')
const LOGO = path.join(ROOT, 'public', 'images', 'logo-512.png')

const W = 1080
const H = 1920
const FPS = 30
/** Region that no Instagram overlay covers. Essential text must stay inside it. */
const SAFE = { x0: 80, x1: 1000, y0: 270, y1: 1250 }
const CW = SAFE.x1 - SAFE.x0
/** Series pill: branding, deliberately above SAFE (top-centre is clear of Reels UI). */
const PILL_Y = 170
/** Feed legibility on a ~390pt-wide phone: 32px ≈ 12pt. Nothing in a video is smaller. */
const MIN_VIDEO_PX = 32

const MIN_S = 15
const MAX_S = 20

// ─── Text ────────────────────────────────────────────────────────────────────

/** renderText with the video floor: nothing on screen below MIN_VIDEO_PX. */
function vText(...a: Parameters<typeof renderText>) {
  if (a[2] < MIN_VIDEO_PX)
    throw new Error(`"${a[0]}" at ${a[2]}px; videos need ≥ ${MIN_VIDEO_PX}px`)
  return renderText(...a)
}
function vTextFit(...a: Parameters<typeof renderTextFit>) {
  if (a[3] < MIN_VIDEO_PX)
    throw new Error(`"${a[0]}" may shrink to ${a[3]}px; videos need ≥ ${MIN_VIDEO_PX}px`)
  return renderTextFit(...a)
}

// ─── Episodes ────────────────────────────────────────────────────────────────

interface Episode {
  n: number
  slug: string
  /** Accent colour — the same band colour as the episode's Ratgeber pin. */
  band: string
  copy: (c: Copy) => VideoEpisode
}

const EPISODES: Episode[] = [
  {
    n: 1,
    slug: 'gerecht-heisst-nicht-gleich',
    band: C.error700,
    copy: (c) => c.videos.geschwister,
  },
  { n: 2, slug: 'faires-zeugnisgeld', band: C.primary700, copy: (c) => c.videos.zeugnisgeld },
  { n: 3, slug: 'belohnen-ohne-geld', band: C.warning800, copy: (c) => c.videos.ohneGeld },
]

// ─── Timing ──────────────────────────────────────────────────────────────────

const ENTER = 0.4 // fade + rise of one element
const EXIT = 0.3 // everything fades before the next beat
const RISE = 36 // px an element travels while entering

/**
 * Seconds a beat must stay fully visible: 0.9 s to find the text plus 0.26 s per word
 * (~230 wpm, the fast end of on-screen reading). Sources count half — they need to be
 * legible, not studied.
 */
function readTime(words: number, sourceWords: number) {
  return 0.9 + 0.26 * words + 0.13 * sourceWords
}
const wordCount = (...s: (string | undefined)[]) =>
  s.filter(Boolean).reduce((a, t) => a + t!.split(/\s+/).filter((w) => /\w/.test(w)).length, 0)

// ─── Raster compositing ──────────────────────────────────────────────────────

interface Sprite {
  data: Buffer // RGBA, not premultiplied
  w: number
  h: number
}

async function sprite(png: Buffer): Promise<Sprite> {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return { data, w: info.width, h: info.height }
}

function hex(c: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)) as [number, number, number]
}

function fillFrame(frame: Buffer, rgb: [number, number, number]) {
  for (let i = 0; i < frame.length; i += 3) {
    frame[i] = rgb[0]
    frame[i + 1] = rgb[1]
    frame[i + 2] = rgb[2]
  }
}

/** Alpha-blend an RGBA sprite onto the RGB frame at (x, y), scaled by `alpha`. */
function blit(frame: Buffer, s: Sprite, x: number, y: number, alpha: number, clipW = s.w) {
  if (alpha <= 0) return
  x = Math.round(x)
  y = Math.round(y)
  const a8 = Math.round(Math.min(1, alpha) * 256)
  for (let sy = 0; sy < s.h; sy++) {
    const fy = y + sy
    if (fy < 0 || fy >= H) continue
    for (let sx = 0; sx < Math.min(s.w, clipW); sx++) {
      const fx = x + sx
      if (fx < 0 || fx >= W) continue
      const so = (sy * s.w + sx) * 4
      const a = (s.data[so + 3] * a8) >> 8
      if (!a) continue
      const fo = (fy * W + fx) * 3
      const ia = 255 - a
      frame[fo] = (s.data[so] * a + frame[fo] * ia) / 255
      frame[fo + 1] = (s.data[so + 1] * a + frame[fo + 1] * ia) / 255
      frame[fo + 2] = (s.data[so + 2] * a + frame[fo + 2] * ia) / 255
    }
  }
}

const easeOut = (t: number) => 1 - (1 - t) ** 3
const clamp01 = (t: number) => Math.max(0, Math.min(1, t))

// ─── Scene model ─────────────────────────────────────────────────────────────

interface Item {
  s: Sprite
  x: number
  y: number
  /** Seconds after beat start at which it begins to enter. 0 + static = on screen at t=0. */
  at: number
  static?: boolean
  /** Essential text: must sit inside SAFE. */
  essential?: boolean
  label: string
}

/** A bar that grows from 0 to `w` px over `dur` seconds, starting at `at`. */
interface Bar {
  x: number
  y: number
  w: number
  h: number
  color: string
  at: number
  dur: number
}

/** A number that counts up to its final value; sprites are pre-rendered per integer. */
interface Counter {
  digits: Sprite[] // index = value
  /** Right edge (align 'right') or centre (align 'centre') */
  x: number
  y: number
  align: 'right' | 'centre'
  value: number
  at: number
  dur: number
  label: string
}

interface Scene {
  bg: string
  items: Item[]
  bars: Bar[]
  counters: Counter[]
  /** Seconds after start when the last element has finished entering / counting. */
  settled: number
  words: number
  sourceWords: number
  /** Audio cue offsets (s) relative to beat start. */
  cues: { at: number; kind: 'tick' | 'count' | 'logo'; n?: number }[]
  minHold: number
}

class SceneBuilder {
  items: Item[] = []
  bars: Bar[] = []
  counters: Counter[] = []
  cues: Scene['cues'] = []
  constructor(readonly bg: string) {}
  add(png: Buffer | Sprite, x: number, y: number, at: number, label: string, essential = true) {
    return (async () => {
      const s = Buffer.isBuffer(png) ? await sprite(png) : png
      this.items.push({ s, x, y, at, label, essential })
      return s
    })()
  }
}

/** Vertically centre a stack of blocks (heights + gaps) inside SAFE; returns each block's top. */
function stack(heights: number[], gaps: number[], name: string): number[] {
  const total = heights.reduce((a, b) => a + b, 0) + gaps.reduce((a, b) => a + b, 0)
  const avail = SAFE.y1 - SAFE.y0
  if (total > avail) throw new Error(`${name}: content is ${total}px tall, safe zone is ${avail}px`)
  let y = SAFE.y0 + (avail - total) / 2
  return heights.map((h, i) => {
    const top = y
    y += h + (gaps[i] ?? 0)
    return Math.round(top)
  })
}

/** Short lines: shrink (not below MIN_VIDEO_PX) to stay on one line rather than orphan a word. */
async function oneLineOrWrap(
  text: string,
  font: (typeof FONTS)[keyof typeof FONTS],
  px: number,
  color: string
) {
  for (let p = px; p >= MIN_VIDEO_PX; p -= 2) {
    const r = await renderText(text, font, p, color)
    if (r.width <= CW) return r
  }
  return vText(text, font, px, color, { maxWidth: CW, align: 'centre' })
}

// ─── Beat builders ───────────────────────────────────────────────────────────

interface Ctx {
  copy: Copy
  ep: Episode
  band: string
  logo: Buffer
}

async function seriesPill(sb: SceneBuilder, ctx: Ctx, onBand: boolean) {
  const label = `${ctx.copy.videos.series} · ${ctx.copy.videos.episodeLabel} ${ctx.ep.n}`
  const t = await vText(label.toUpperCase(), FONTS.bold, 32, onBand ? ctx.band : C.white)
  const pw = t.width + 56
  const ph = t.height + 26
  const x = (W - pw) / 2
  await sb.add(await rect(pw, ph, onBand ? C.white : ctx.band, ph / 2), x, PILL_Y, 0, 'pill', false)
  await sb.add(t.buffer, x + 28, PILL_Y + 13, 0, 'pill text', false)
  sb.items.slice(-2).forEach((i) => (i.static = true))
}

const centreX = (w: number) => SAFE.x0 + (CW - w) / 2

async function hook(b: Extract<VideoBeat, { kind: 'hook' }>, ctx: Ctx): Promise<Scene> {
  const sb = new SceneBuilder(ctx.band)
  await seriesPill(sb, ctx, true)
  const head = await vTextFit(b.headline, FONTS.extrabold, 110, 72, C.white, CW, 560, {
    align: 'centre',
  })
  const sub = b.sub
    ? await vText(b.sub, FONTS.semibold, 48, C.primary100, { maxWidth: CW, align: 'centre' })
    : null
  const ys = stack(sub ? [head.height, sub.height] : [head.height], [48], 'hook')
  // The headline is on screen from frame 0: muted autoplay and the Reels cover both show it.
  await sb.add(head.buffer, centreX(head.width), ys[0], 0, 'headline')
  sb.items[sb.items.length - 1].static = true
  if (sub) {
    await sb.add(sub.buffer, centreX(sub.width), ys[1], 0.6, 'sub')
    sb.cues.push({ at: 0.6, kind: 'tick' })
  }
  return done(sb, sub ? 0.6 + ENTER : 0, wordCount(b.headline, b.sub), 0, 2.4)
}

async function compare(b: Extract<VideoBeat, { kind: 'compare' }>, ctx: Ctx): Promise<Scene> {
  const sb = new SceneBuilder(C.primary50)
  await seriesPill(sb, ctx, false)
  const head = b.headline
    ? await vText(b.headline, FONTS.extrabold, 68, C.neutral900, { maxWidth: CW, align: 'centre' })
    : null
  const pad = 40
  const side = async (s: typeof b.left, accent: string) => {
    const tag = await vText(s.tag.toUpperCase(), FONTS.bold, 34, C.white)
    const title = await vText(s.title, FONTS.extrabold, 54, C.neutral900, {
      maxWidth: CW - 2 * pad,
    })
    const body = await vText(s.body, FONTS.regular, 46, C.neutral700, {
      maxWidth: CW - 2 * pad,
    })
    const tagH = tag.height + 20
    const h = pad + tagH + 24 + title.height + 16 + body.height + pad
    return { tag, title, body, tagH, h, accent }
  }
  const L = await side(b.left, C.neutral500)
  const R = await side(b.right, ctx.band)
  const heights = [...(head ? [head.height] : []), L.h, R.h]
  const ys = stack(heights, head ? [44, 36] : [36], 'compare')
  if (head) await sb.add(head.buffer, centreX(head.width), ys[0], 0, 'headline')
  const [yl, yr] = ys.slice(-2)
  const place = async (s: typeof L, y: number, at: number, highlight: boolean) => {
    const c = await card(CW, s.h, { radius: 28, stroke: highlight ? s.accent : undefined })
    await sb.add(c, SAFE.x0 - SHADOW_PAD, y - SHADOW_PAD, at, 'card', false)
    await sb.add(
      await rect(s.tag.width + 36, s.tagH, s.accent, s.tagH / 2),
      SAFE.x0 + pad,
      y + pad,
      at,
      'tag bg',
      false
    )
    await sb.add(s.tag.buffer, SAFE.x0 + pad + 18, y + pad + 10, at, 'tag')
    let ty = y + pad + s.tagH + 24
    await sb.add(s.title.buffer, SAFE.x0 + pad, ty, at, 'title')
    ty += s.title.height + 16
    await sb.add(s.body.buffer, SAFE.x0 + pad, ty, at, 'body')
    sb.cues.push({ at, kind: 'tick' })
  }
  await place(L, yl, 0.2, false)
  await place(R, yr, 1.0, true)
  return done(
    sb,
    1.0 + ENTER,
    wordCount(
      b.headline,
      b.left.tag,
      b.left.title,
      b.left.body,
      b.right.tag,
      b.right.title,
      b.right.body
    ),
    0
  )
}

async function statement(b: Extract<VideoBeat, { kind: 'statement' }>, ctx: Ctx): Promise<Scene> {
  const sb = new SceneBuilder(C.primary50)
  await seriesPill(sb, ctx, false)
  const label = await vText(b.label.toUpperCase(), FONTS.bold, 34, ctx.band)
  const head = await vTextFit(b.headline, FONTS.extrabold, 76, 56, C.neutral900, CW, 460, {
    align: 'centre',
  })
  const body = b.body
    ? await vText(b.body, FONTS.regular, 46, C.neutral700, { maxWidth: CW, align: 'centre' })
    : null
  const note = b.note ? await oneLineOrWrap(b.note, FONTS.semibold, 38, ctx.band) : null
  const src = b.source
    ? await vText(b.source, FONTS.regular, 34, C.neutral500, { maxWidth: CW, align: 'centre' })
    : null
  const blocks = [label, head, body, note, src].filter(Boolean) as { height: number }[]
  const gaps = [28, 40, 36, 24].slice(0, blocks.length - 1)
  const ys = stack(
    blocks.map((x) => x.height),
    gaps,
    'statement'
  )
  let i = 0
  await sb.add(label.buffer, centreX(label.width), ys[i++], 0, 'label')
  await sb.add(head.buffer, centreX(head.width), ys[i++], 0.15, 'headline')
  let last = 0.15
  if (body) {
    last = 0.8
    await sb.add(body.buffer, centreX(body.width), ys[i++], last, 'body')
    sb.cues.push({ at: last, kind: 'tick' })
  }
  if (note) {
    last += 0.6
    await sb.add(note.buffer, centreX(note.width), ys[i++], last, 'note')
  }
  if (src) await sb.add(src.buffer, centreX(src.width), ys[i++], last, 'source')
  return done(sb, last + ENTER, wordCount(b.label, b.headline, b.body, b.note), wordCount(b.source))
}

async function numberSprites(max: number, unit: string, px: number, color: string) {
  const out: Sprite[] = []
  for (let v = 0; v <= max; v++) {
    out.push(await sprite((await vText(`${v}${unit}`, FONTS.extrabold, px, color)).buffer))
  }
  return out
}

/** "21 %" / "12 €" with a narrow no-break space, as German typography wants. */
const withUnit = (unit: string) => (unit ? ` ${unit}` : '')

async function stat(b: Extract<VideoBeat, { kind: 'stat' }>, ctx: Ctx): Promise<Scene> {
  const sb = new SceneBuilder(C.primary50)
  await seriesPill(sb, ctx, false)
  const digits = await numberSprites(b.value, withUnit(b.unit), 240, ctx.band)
  const big = digits[b.value]
  const barH = 34
  const label = await vText(b.label, FONTS.extrabold, 58, C.neutral900, {
    maxWidth: CW,
    align: 'centre',
  })
  const src = await vText(b.source, FONTS.regular, 34, C.neutral500, {
    maxWidth: CW,
    align: 'centre',
  })
  const [yn, yb, yl, ys] = stack([big.h, barH, label.height, src.height], [36, 44, 36], 'stat')
  sb.counters.push({
    digits,
    x: W / 2,
    y: yn,
    align: 'centre',
    value: b.value,
    at: 0.2,
    dur: 1.2,
    label: 'stat',
  })
  await sb.add(await rect(CW, barH, C.neutral200, barH / 2), SAFE.x0, yb, 0.2, 'track', false)
  sb.bars.push({
    x: SAFE.x0,
    y: yb,
    w: Math.round((CW * b.value) / 100),
    h: barH,
    color: ctx.band,
    at: 0.2,
    dur: 1.2,
  })
  await sb.add(label.buffer, centreX(label.width), yl, 0.9, 'label')
  await sb.add(src.buffer, centreX(src.width), ys, 0.9, 'source')
  sb.cues.push({ at: 0.2, kind: 'count', n: 8 })
  return done(sb, 1.4, wordCount(`${b.value}`, b.label), wordCount(b.source))
}

async function bars(b: Extract<VideoBeat, { kind: 'bars' }>, ctx: Ctx): Promise<Scene> {
  const sb = new SceneBuilder(C.primary50)
  await seriesPill(sb, ctx, false)
  const head = await vText(b.headline, FONTS.extrabold, 64, C.neutral900, {
    maxWidth: CW,
    align: 'centre',
  })
  const barH = 40
  const rows = await Promise.all(
    b.bars.map(async (r) => ({
      r,
      label: await vText(r.label, FONTS.bold, 46, C.neutral900, { maxWidth: CW - 200 }),
      digits: await numberSprites(r.value, withUnit(b.unit), 50, ctx.band),
    }))
  )
  const rowH = (r: (typeof rows)[number]) =>
    Math.max(r.label.height, r.digits[r.r.value].h) + 16 + barH
  const note = b.note
    ? await vText(b.note, FONTS.extrabold, 50, ctx.band, { maxWidth: CW, align: 'centre' })
    : null
  const src = await vText(b.source, FONTS.regular, 34, C.neutral500, {
    maxWidth: CW,
    align: 'centre',
  })
  const heights = [head.height, ...rows.map(rowH), ...(note ? [note.height] : []), src.height]
  const gaps = [56, ...rows.map(() => 44).slice(0, -1), ...(note ? [56] : []), 44]
  const ys = stack(heights, gaps, 'bars')
  await sb.add(head.buffer, centreX(head.width), ys[0], 0, 'headline')
  let at = 0.4
  for (const [i, r] of rows.entries()) {
    const y = ys[i + 1]
    await sb.add(r.label.buffer, SAFE.x0, y, at, r.r.label)
    sb.counters.push({
      digits: r.digits,
      x: SAFE.x1,
      y,
      align: 'right',
      value: r.r.value,
      at,
      dur: 0.9,
      label: r.r.label,
    })
    const by = y + Math.max(r.label.height, r.digits[r.r.value].h) + 16
    await sb.add(await rect(CW, barH, C.neutral200, barH / 2), SAFE.x0, by, at, 'track', false)
    sb.bars.push({
      x: SAFE.x0,
      y: by,
      w: Math.round((CW * r.r.value) / 100),
      h: barH,
      color: ctx.band,
      at,
      dur: 0.9,
    })
    sb.cues.push({ at, kind: 'count', n: 5 })
    at += 0.8
  }
  at -= 0.8
  const settled = at + 0.9
  if (note) {
    at = settled
    await sb.add(note.buffer, centreX(note.width), ys[rows.length + 1], at, 'note')
    sb.cues.push({ at, kind: 'tick' })
  }
  await sb.add(src.buffer, centreX(src.width), ys[ys.length - 1], at, 'source')
  return done(
    sb,
    Math.max(settled, at + ENTER),
    wordCount(b.headline, b.note, ...b.bars.map((x) => `${x.label} ${x.value}`)),
    wordCount(b.source)
  )
}

async function list(b: Extract<VideoBeat, { kind: 'list' }>, ctx: Ctx): Promise<Scene> {
  const sb = new SceneBuilder(C.primary50)
  await seriesPill(sb, ctx, false)
  const head = await vText(b.headline, FONTS.extrabold, 68, C.neutral900, {
    maxWidth: CW,
    align: 'centre',
  })
  const marker = 64
  const pad = 30
  const textW = CW - 2 * pad - marker - 28
  // "Label: text" → bold label line over a regular line, instead of a ragged wrap.
  const items = await Promise.all(
    b.items.map(async (t) => {
      const i = t.indexOf(': ')
      const label = await vText(i > 0 ? t.slice(0, i + 1) : t, FONTS.extrabold, 48, C.neutral900, {
        maxWidth: textW,
      })
      const rest =
        i > 0
          ? await vText(t.slice(i + 2), FONTS.regular, 44, C.neutral700, { maxWidth: textW })
          : null
      return { label, rest, height: label.height + (rest ? 8 + rest.height : 0) }
    })
  )
  const itemH = items.map((t) => Math.max(marker, t.height) + 2 * pad)
  const src = b.source
    ? await vText(b.source, FONTS.regular, 34, C.neutral500, { maxWidth: CW, align: 'centre' })
    : null
  const heights = [head.height, ...itemH, ...(src ? [src.height] : [])]
  const gaps = [48, ...itemH.map(() => 22).slice(0, -1), ...(src ? [36] : [])]
  const ys = stack(heights, gaps, 'list')
  await sb.add(head.buffer, centreX(head.width), ys[0], 0, 'headline')
  const colors = [ctx.band, C.success600, C.secondary600, C.warning500]
  let at = 0.3
  for (const [i, t] of items.entries()) {
    const y = ys[i + 1]
    await sb.add(
      await card(CW, itemH[i], { radius: 24 }),
      SAFE.x0 - SHADOW_PAD,
      y - SHADOW_PAD,
      at,
      'card',
      false
    )
    const m = await numberMarker(i + 1, marker, colors[i % colors.length])
    await sb.add(m.buffer, SAFE.x0 + pad, y + (itemH[i] - marker) / 2, at, 'marker', false)
    const tx = SAFE.x0 + pad + marker + 28
    const ty = y + (itemH[i] - t.height) / 2
    await sb.add(t.label.buffer, tx, ty, at, `item ${i + 1}`)
    if (t.rest) await sb.add(t.rest.buffer, tx, ty + t.label.height + 8, at, `item ${i + 1} text`)
    sb.cues.push({ at, kind: 'tick' })
    at += 0.5
  }
  at -= 0.5
  if (src) await sb.add(src.buffer, centreX(src.width), ys[ys.length - 1], at, 'source')
  return done(sb, at + ENTER, wordCount(b.headline, ...b.items), wordCount(b.source))
}

async function end(b: Extract<VideoBeat, { kind: 'end' }>, ctx: Ctx): Promise<Scene> {
  const sb = new SceneBuilder(ctx.band)
  await seriesPill(sb, ctx, true)
  const logoD = 150
  const logo = await sharp(ctx.logo).resize(logoD, logoD).png().toBuffer()
  const head = await vTextFit(b.headline, FONTS.extrabold, 96, 64, C.white, CW, 360, {
    align: 'centre',
  })
  const url = await vText(b.url, FONTS.extrabold, 70, ctx.band)
  const urlPadX = 52
  const urlH = url.height + 44
  const cta = await vText(b.cta, FONTS.semibold, 42, C.white, { maxWidth: CW, align: 'centre' })
  const src = await vText(b.source, FONTS.regular, 34, C.primary100, {
    maxWidth: CW,
    align: 'centre',
  })
  const [yl, yh, yu, yc, ys] = stack(
    [logoD, head.height, urlH, cta.height, src.height],
    [44, 56, 32, 40],
    'end'
  )
  await sb.add(logo, (W - logoD) / 2, yl, 0, 'logo', false)
  await sb.add(head.buffer, centreX(head.width), yh, 0.15, 'headline')
  const uw = url.width + 2 * urlPadX
  await sb.add(await rect(uw, urlH, C.white, urlH / 2), (W - uw) / 2, yu, 0.4, 'url pill', false)
  await sb.add(url.buffer, (W - url.width) / 2, yu + 22, 0.4, 'url')
  await sb.add(cta.buffer, centreX(cta.width), yc, 0.6, 'cta')
  await sb.add(src.buffer, centreX(src.width), ys, 0.6, 'source')
  sb.cues.push({ at: 0.4, kind: 'logo' })
  return done(sb, 0.6 + ENTER, wordCount(b.headline, b.url, b.cta), wordCount(b.source), 2.6)
}

function done(
  sb: SceneBuilder,
  settled: number,
  words: number,
  sourceWords: number,
  minHold = 0
): Scene {
  return {
    bg: sb.bg,
    items: sb.items,
    bars: sb.bars,
    counters: sb.counters,
    cues: sb.cues,
    settled,
    words,
    sourceWords,
    minHold,
  }
}

async function buildScene(b: VideoBeat, ctx: Ctx): Promise<Scene> {
  switch (b.kind) {
    case 'hook':
      return hook(b, ctx)
    case 'compare':
      return compare(b, ctx)
    case 'statement':
      return statement(b, ctx)
    case 'stat':
      return stat(b, ctx)
    case 'bars':
      return bars(b, ctx)
    case 'list':
      return list(b, ctx)
    case 'end':
      return end(b, ctx)
  }
}

// ─── Contract ────────────────────────────────────────────────────────────────

function checkScene(s: Scene, name: string) {
  const problems: string[] = []
  for (const i of s.items) {
    if (i.x < 0 || i.y < 0 || i.x + i.s.w > W || i.y + i.s.h > H)
      problems.push(`"${i.label}" leaves the frame`)
    if (
      i.essential &&
      (i.x < SAFE.x0 - 1 ||
        i.x + i.s.w > SAFE.x1 + 1 ||
        i.y < SAFE.y0 - 1 ||
        i.y + i.s.h > SAFE.y1 + 1)
    )
      problems.push(
        `"${i.label}" outside the Reels safe zone: ${JSON.stringify({ x: i.x, y: i.y, w: i.s.w, h: i.s.h })}`
      )
  }
  for (const c of s.counters) {
    const d = c.digits[c.value]
    const x0 = c.align === 'right' ? c.x - d.w : c.x - d.w / 2
    if (x0 < SAFE.x0 - 1 || x0 + d.w > SAFE.x1 + 1 || c.y < SAFE.y0 || c.y + d.h > SAFE.y1)
      problems.push(`counter "${c.label}" outside the safe zone`)
  }
  if (problems.length)
    throw new Error(`[${name}] video layout contract broken:\n  ${problems.join('\n  ')}`)
}

// ─── Frames ──────────────────────────────────────────────────────────────────

interface Timed extends Scene {
  start: number
  dur: number
  hold: number
}

const barCache = new Map<string, Sprite>()
async function barSprite(w: number, h: number, color: string) {
  const k = `${w}|${h}|${color}`
  let s = barCache.get(k)
  if (!s) {
    s = await sprite(await rect(w, h, color, h / 2))
    barCache.set(k, s)
  }
  return s
}

function lerpRgb(a: string, b: string, t: number): [number, number, number] {
  const A = hex(a)
  const B = hex(b)
  return [0, 1, 2].map((i) => Math.round(A[i] + (B[i] - A[i]) * t)) as [number, number, number]
}

async function drawFrame(frame: Buffer, beats: Timed[], t: number) {
  const k = beats.findIndex((b) => t < b.start + b.dur)
  const b = beats[k === -1 ? beats.length - 1 : k]
  const next = beats[(k === -1 ? beats.length - 1 : k) + 1]
  const lt = t - b.start
  const exitT = next ? clamp01((lt - (b.dur - EXIT)) / EXIT) : 0
  fillFrame(frame, next && exitT > 0 ? lerpRgb(b.bg, next.bg, easeOut(exitT)) : hex(b.bg))
  const out = 1 - exitT

  for (const i of b.items) {
    if (i.static) {
      blit(frame, i.s, i.x, i.y, out)
      continue
    }
    const p = clamp01((lt - i.at) / ENTER)
    if (p <= 0) continue
    blit(frame, i.s, i.x, i.y + (1 - easeOut(p)) * RISE, easeOut(p) * out)
  }
  for (const bar of b.bars) {
    const p = easeOut(clamp01((lt - bar.at) / bar.dur))
    const w = Math.round(bar.w * p)
    if (w < bar.h) continue // a bar shorter than its own rounding reads as a dot
    blit(frame, await barSprite(w, bar.h, bar.color), bar.x, bar.y, out)
  }
  for (const c of b.counters) {
    const p = clamp01((lt - c.at) / c.dur)
    if (lt < c.at) continue
    const v = Math.round(c.value * easeOut(p))
    const d = c.digits[v]
    const fade = clamp01((lt - c.at) / ENTER)
    const x = c.align === 'right' ? c.x - d.w : c.x - d.w / 2
    blit(frame, d, x, c.y, fade * out)
  }
}

// ─── Audio (synthesised; no samples, no licences) ───────────────────────────

const SR = 48000

function tone(freq: number, dur: number, gain: number, decay: number, attack = 0.004) {
  const n = Math.floor(dur * SR)
  const out = new Float32Array(n)
  const partials = [1, 0.32, 0.1]
  const norm = partials.reduce((a, b) => a + b, 0)
  for (let i = 0; i < n; i++) {
    const s = i / SR
    let v = 0
    for (let p = 0; p < partials.length; p++)
      v += partials[p] * Math.sin(2 * Math.PI * freq * (p + 1) * s)
    out[i] = (v / norm) * Math.min(1, s / attack) * Math.exp(-s * decay) * gain
  }
  return out
}

class Track {
  buf: Float32Array
  constructor(readonly dur: number) {
    this.buf = new Float32Array(Math.ceil(dur * SR))
  }
  add(at: number, w: Float32Array) {
    const o = Math.floor(at * SR)
    for (let i = 0; i < w.length && o + i < this.buf.length; i++)
      if (o + i >= 0) this.buf[o + i] += w[i]
  }
  pad(freqs: number[], from: number, to: number, gain: number) {
    const n = Math.floor((to - from) * SR)
    const w = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      const s = i / SR
      let v = 0
      for (const f of freqs)
        v += Math.sin(2 * Math.PI * f * s) + Math.sin(2 * Math.PI * f * 1.003 * s)
      const fade = Math.min(1, s / 1.0, (to - from - s) / 1.0)
      w[i] = (v / (2 * freqs.length)) * fade * gain
    }
    this.add(from, w)
  }
  wav(file: string) {
    let peak = 0
    for (const v of this.buf) peak = Math.max(peak, Math.abs(v))
    const scale = peak > 0 ? 0.85 / peak : 0
    const pcm = Buffer.alloc(this.buf.length * 2)
    const k = Math.floor(0.015 * SR)
    for (let i = 0; i < this.buf.length; i++) {
      const edge = Math.min(1, i / k, (this.buf.length - 1 - i) / k)
      pcm.writeInt16LE(Math.round(this.buf[i] * scale * edge * 32767), i * 2)
    }
    const h = Buffer.alloc(44)
    h.write('RIFF', 0)
    h.writeUInt32LE(36 + pcm.length, 4)
    h.write('WAVEfmt ', 8)
    h.writeUInt32LE(16, 16)
    h.writeUInt16LE(1, 20)
    h.writeUInt16LE(1, 22)
    h.writeUInt32LE(SR, 24)
    h.writeUInt32LE(SR * 2, 28)
    h.writeUInt16LE(2, 32)
    h.writeUInt16LE(16, 34)
    h.write('data', 36)
    h.writeUInt32LE(pcm.length, 40)
    fs.writeFileSync(file, Buffer.concat([h, pcm]))
  }
}

// C major pentatonic — any two notes sit together without a clash.
const PENT = [523.25, 587.33, 659.25, 783.99, 880.0]

/**
 * The Bonifatus sonic logo, identical in every episode: a suspended chord that resolves
 * (Csus4 → C). Lalabuba's logo is a rising arpeggio — delight; this one is a tension
 * settling — an argument ending. Recognition compounds only if it never changes.
 */
function sonicLogo(tr: Track, at: number) {
  for (const f of [392.0, 523.25, 698.46]) tr.add(at, tone(f, 0.5, 0.16, 7)) // G4 C5 F5 (sus4)
  for (const f of [392.0, 523.25, 659.25, 1046.5]) tr.add(at + 0.32, tone(f, 2.2, 0.18, 2.2)) // → C major
}

function score(beats: Timed[], dur: number): Track {
  const tr = new Track(dur)
  tr.pad([130.81, 196.0, 261.63], 0, dur, 0.03) // C3 G3 C4 bed under everything
  for (const b of beats) {
    if (b.start > 0) tr.add(b.start + 0.02, tone(1567.98, 0.12, 0.05, 40)) // beat change
    for (const c of b.cues) {
      const at = b.start + c.at
      if (c.kind === 'tick') tr.add(at, tone(1318.51, 0.14, 0.05, 32))
      if (c.kind === 'count')
        for (let i = 0; i < (c.n ?? 5); i++)
          tr.add(at + i * 0.11, tone(PENT[i % PENT.length], 0.12, 0.045, 30))
      if (c.kind === 'logo') sonicLogo(tr, at)
    }
  }
  return tr
}

// ─── Build ───────────────────────────────────────────────────────────────────

async function buildEpisode(ep: Episode, copy: Copy) {
  const v = ep.copy(copy)
  const ctx: Ctx = { copy, ep, band: ep.band, logo: fs.readFileSync(LOGO) }
  if (v.beats[0]?.kind !== 'hook') throw new Error(`episode ${ep.n}: first beat must be a hook`)
  if (v.beats[v.beats.length - 1]?.kind !== 'end')
    throw new Error(`episode ${ep.n}: last beat must be the end card`)

  const scenes: Scene[] = []
  for (const b of v.beats) {
    const s = await buildScene(b, ctx)
    checkScene(s, `ep${ep.n} ${b.kind}`)
    scenes.push(s)
  }

  // Each beat: everything enters, then holds for its reading time, then exits.
  let t = 0
  const beats: Timed[] = scenes.map((s, i) => {
    const hold = Math.max(s.minHold, readTime(s.words, s.sourceWords))
    const last = i === scenes.length - 1
    const dur = s.settled + hold + (last ? 0 : EXIT)
    const tb = { ...s, start: t, dur, hold }
    t += dur
    return tb
  })
  // A short episode lengthens its end card; a long one is refused — cut words, not reading time.
  if (t < MIN_S) {
    beats[beats.length - 1].dur += MIN_S - t
    t = MIN_S
  }
  const breakdown = beats
    .map((b, i) => `${v.beats[i].kind} ${b.dur.toFixed(2)}s (read ${b.hold.toFixed(2)}s)`)
    .join(', ')
  if (t > MAX_S)
    throw new Error(`episode ${ep.n} is ${t.toFixed(1)}s (max ${MAX_S}s): ${breakdown}`)

  fs.mkdirSync(path.join(OUT, 'covers'), { recursive: true })
  const name = `${String(ep.n).padStart(2, '0')}_${ep.slug}`
  const mp4 = path.join(OUT, `${name}.mp4`)
  const wav = path.join(os.tmpdir(), `bonifatus-${name}-${process.pid}.wav`)
  score(beats, t).wav(wav)

  const nFrames = Math.round(t * FPS)
  const ff = spawn(
    'ffmpeg',
    [
      ...['-v', 'error', '-y'],
      ...['-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-'],
      ...['-i', wav],
      ...['-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p'],
      ...['-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', mp4],
    ],
    { stdio: ['pipe', 'inherit', 'inherit'] }
  )
  const exited = once(ff, 'close')
  const frame = Buffer.alloc(W * H * 3)
  try {
    for (let f = 0; f < nFrames; f++) {
      await drawFrame(frame, beats, f / FPS)
      if (f === 0) {
        // Reels cover = the hook as it appears on frame 0.
        await sharp(frame, { raw: { width: W, height: H, channels: 3 } })
          .jpeg({ quality: 92 })
          .toFile(path.join(OUT, 'covers', `${name}.jpg`))
      }
      if (!ff.stdin.write(Buffer.from(frame))) await once(ff.stdin, 'drain')
    }
    ff.stdin.end()
    const [code] = await exited
    if (code !== 0) throw new Error(`ffmpeg exited with ${code}`)
  } finally {
    fs.rmSync(wav, { force: true })
  }

  const probe = spawnSync(
    'ffprobe',
    [
      '-v',
      'error',
      '-show_entries',
      'stream=codec_type,width,height',
      '-show_entries',
      'format=duration',
      '-of',
      'json',
      mp4,
    ],
    { encoding: 'utf8' }
  )
  const info = JSON.parse(probe.stdout)
  const video = info.streams.find((s: { codec_type: string }) => s.codec_type === 'video')
  const dur = Number(info.format.duration)
  if (video.width !== W || video.height !== H)
    throw new Error(`${mp4} is ${video.width}×${video.height}`)
  if (dur < MIN_S - 0.1 || dur > MAX_S + 0.1) throw new Error(`${mp4} is ${dur}s`)
  console.log(`ep${ep.n}  ${dur.toFixed(2)}s  ${path.relative(ROOT, mp4)}\n      ${breakdown}`)
  console.log(`      beat starts: ${beats.map((b) => b.start.toFixed(2)).join(' · ')}  → ${v.page}`)
}

async function main() {
  const args = process.argv.slice(2)
  const only = args.find((a) => !a.startsWith('--'))
  const locale = (args.find((a) => a.startsWith('--locale='))?.split('=')[1] ?? 'de') as Locale
  const copy = COPY[locale]
  if (!copy) throw new Error(`No copy for locale "${locale}" in scripts/social/copy.ts`)
  assertNoTransliteration(locale, copy)
  for (const ep of EPISODES) {
    if (only && String(ep.n) !== only) continue
    await buildEpisode(ep, copy)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
