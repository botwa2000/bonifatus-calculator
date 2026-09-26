// Social image generator for Bonifatus (Pinterest pins + Instagram carousel).
//
//   npx tsx scripts/make-social-assets.ts                # fixture + all assets (de)
//   npx tsx scripts/make-social-assets.ts fixture        # diacritics fixture only
//   npx tsx scripts/make-social-assets.ts --locale=de
//
// Every concept is emitted natively at both target sizes — never cropped from
// one into the other:
//   ig   1080×1350 (4:5)  Instagram post / carousel
//   pin  1000×1500 (2:3)  Pinterest
//
// Layout contract (both sizes):
//   - Header zone: solid brand band holding logo, label, headline, subtext.
//   - Content zone below it: screenshots are never overlapped by text or by
//     callout boxes (checked at runtime); only a callout's arrow tip enters.
//   - All text ≥ 60px from every edge, headline ≥ 52px, nothing < 28px.
//   - ig: nothing essential below y=1150. The small bonifatus.com footer sits
//     in the same place on every frame.
//
// Screenshots come from docs/social-content/source/, captured from the live
// app by the `social` block in scripts/take-screenshots.ts.
//
// Copy lives in scripts/social/copy.ts; to add a locale, add strings there and
// pass --locale. Rendering primitives are in scripts/social/render.ts.
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import {
  FONTS,
  C,
  SHADOW_PAD,
  renderText,
  renderTextFit,
  card,
  rect,
  circle,
  checkIcon,
  checkbox,
  dashedLine,
  numberMarker,
  drawCallout,
  svg,
  overlaps,
  type Box,
  type Layer,
  type Rendered,
} from './social/render'
import {
  COPY,
  DJI_MONTHLY,
  DJI_WEEKLY,
  assertNoTransliteration,
  type Copy,
  type Locale,
} from './social/copy'

const ROOT = path.join(__dirname, '..')
const OUT = path.join(ROOT, 'docs', 'social-content')
const SRC = path.join(OUT, 'source')
const LOGO = path.join(ROOT, 'public', 'images', 'logo-512.png')

// Keep in sync with the fixture described in docs/social-content/manifest.md.
export const DIACRITICS_FIXTURE =
  'Fächer Willkür Prämien für Zeugnisgeld — ÄÖÜäöüß · àéîôû ç · ñ · привет'

type SizeKey = 'ig' | 'pin'
interface Size {
  key: SizeKey
  W: number
  H: number
  /** Lowest y any essential element may reach. */
  contentBottom: number
  /** Top of the bonifatus.com footer. */
  footerTop: number
}

const M = 60 // edge margin for all text
const MIN_SHOT_W = 0.55

const SIZES: Size[] = [
  { key: 'ig', W: 1080, H: 1350, contentBottom: 1130, footerTop: 1212 },
  { key: 'pin', W: 1000, H: 1500, contentBottom: 1368, footerTop: 1400 },
]

// ─── Frame ───────────────────────────────────────────────────────────────────

type Kind = 'text' | 'image' | 'callout' | 'deco'

class Frame {
  layers: Layer[] = []
  boxes: { box: Box; kind: Kind; label: string }[] = []
  constructor(
    readonly size: Size,
    readonly bg: string = C.primary50
  ) {}

  get W() {
    return this.size.W
  }

  add(input: Buffer, left: number, top: number) {
    this.layers.push({ input, left: Math.round(left), top: Math.round(top) })
  }

  /** Add rendered text and record its box for the edge/overlap checks. */
  text(r: Rendered, left: number, top: number, label: string) {
    this.add(r.buffer, left, top)
    this.boxes.push({ box: { x: left, y: top, w: r.width, h: r.height }, kind: 'text', label })
  }

  reserve(box: Box, kind: Kind, label: string) {
    this.boxes.push({ box, kind, label })
  }

  /** Enforce the layout contract before writing anything. */
  check(name: string) {
    const { W, H, contentBottom, footerTop } = this.size
    const problems: string[] = []
    for (const { box, kind, label } of this.boxes) {
      if (kind === 'text' || kind === 'callout') {
        if (box.x < M || box.y < M || box.x + box.w > W - M || box.y + box.h > H - M) {
          problems.push(`${kind} "${label}" within ${M}px of an edge: ${JSON.stringify(box)}`)
        }
        const isFooter = label === 'footer'
        if (!isFooter && box.y + box.h > contentBottom) {
          problems.push(
            `${kind} "${label}" below content bottom ${contentBottom}: ends at ${box.y + box.h}`
          )
        }
        if (isFooter && box.y < footerTop - 1) problems.push('footer moved')
      }
      if (kind === 'image' && box.y + box.h > contentBottom) {
        problems.push(`image "${label}" below content bottom: ends at ${box.y + box.h}`)
      }
      // A screenshot narrower than this is unreadable at feed size (~230px).
      if (kind === 'image' && box.w < MIN_SHOT_W * W) {
        problems.push(
          `image "${label}" only ${box.w}px wide (< ${Math.round(MIN_SHOT_W * 100)}% of frame): illegible in feed`
        )
      }
    }
    // Text and callouts must never sit on a screenshot.
    const images = this.boxes.filter((b) => b.kind === 'image')
    for (const t of this.boxes.filter((b) => b.kind === 'text' || b.kind === 'callout')) {
      for (const i of images) {
        if (overlaps(t.box, i.box))
          problems.push(`${t.kind} "${t.label}" overlaps screenshot "${i.label}"`)
      }
    }
    if (problems.length)
      throw new Error(
        `[${name} ${this.size.key}] layout contract broken:\n  ${problems.join('\n  ')}`
      )
  }

  async write(file: string, name: string) {
    this.check(name)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    await sharp({
      create: { width: this.size.W, height: this.size.H, channels: 3, background: this.bg },
    })
      .composite(this.layers)
      .png({ compressionLevel: 9 })
      .toFile(file)
    const meta = await sharp(file).metadata()
    if (meta.width !== this.size.W || meta.height !== this.size.H) {
      throw new Error(
        `${file} is ${meta.width}×${meta.height}, expected ${this.size.W}×${this.size.H}`
      )
    }
  }
}

// ─── Shared chrome ───────────────────────────────────────────────────────────

interface HeaderOpts {
  band: string
  label?: string
  step?: number
  headline: string
  subtext?: string
  headlineMax?: number
  /** Max headline block height; the fit shrinks the size until it fits. */
  headlineMaxH?: number
}

/** Solid brand band with logo, optional label/step pill, headline, subtext. Returns its bottom y. */
async function header(f: Frame, o: HeaderOpts): Promise<number> {
  const W = f.W
  const textW = W - 2 * M
  const layers: [Rendered, number, number, string][] = []
  let y = M

  // Logo + wordmark
  const logoD = 64
  const logo = await sharp(LOGO).resize(logoD, logoD).png().toBuffer()
  const word = await renderText('Bonifatus', FONTS.extrabold, 36, C.white)
  const rowH = Math.max(logoD, word.height)
  const logoLayer = { input: logo, left: M, top: y + (rowH - logoD) / 2 }
  layers.push([word, M + logoD + 16, y + (rowH - word.height) / 2, 'wordmark'])

  // Label pill on the right of the logo row: "Schritt ①" style or a topic tag.
  let pill: { buf: Buffer; x: number; y: number } | null = null
  const pillLayers: [Rendered, number, number, string][] = []
  if (o.label) {
    const t = await renderText(o.label.toUpperCase(), FONTS.bold, 28, o.band)
    const markerD = o.step != null ? 48 : 0
    const padX = 22
    const gap = o.step != null ? 12 : 0
    const pw = padX * 2 + markerD + gap + t.width
    const ph = Math.max(t.height, markerD) + 20
    const px = W - M - pw
    const py = y + (rowH - ph) / 2
    pill = { buf: await rect(pw, ph, C.white, ph / 2), x: px, y: py }
    if (o.step != null) {
      const m = await numberMarker(o.step, markerD, o.band)
      pillLayers.push([m, px + padX - 8, py + (ph - markerD) / 2, 'step marker'])
    }
    pillLayers.push([t, px + padX + markerD + gap, py + (ph - t.height) / 2, 'label'])
  }
  y += rowH + 40

  const hl = await renderTextFit(
    o.headline,
    FONTS.extrabold,
    o.headlineMax ?? (f.size.key === 'ig' ? 72 : 68),
    52,
    C.white,
    textW,
    o.headlineMaxH ?? 250,
    { lineSpacing: 0 }
  )
  layers.push([hl, M, y, `headline "${o.headline}"`])
  y += hl.height

  if (o.subtext) {
    y += 22
    const st = await renderTextFit(o.subtext, FONTS.regular, 34, 28, C.primary100, textW, 100)
    layers.push([st, M, y, `subtext "${o.subtext}"`])
    y += st.height
  }
  const bottom = y + 48

  f.add(await rect(W, bottom, o.band), 0, 0)
  f.add(logoLayer.input, logoLayer.left, logoLayer.top)
  if (pill) f.add(pill.buf, pill.x, pill.y)
  for (const [r, x, yy, label] of [...layers, ...pillLayers]) f.text(r, x, yy, label)
  return bottom
}

/** bonifatus.com, small, identical position on every frame of a size. */
async function footer(f: Frame, url: string) {
  const t = await renderText(url, FONTS.semibold, 30, C.primary700)
  const d = 40
  const logo = await sharp(LOGO).resize(d, d).png().toBuffer()
  const w = d + 12 + t.width
  const x = (f.W - w) / 2
  const y = f.size.footerTop
  f.add(logo, x, y + (t.height - d) / 2)
  f.text(t, x + d + 12, y, 'footer')
}

// ─── Screenshots ─────────────────────────────────────────────────────────────

interface Shot {
  file: string
  /** Source-pixel crop (defaults to the whole image). */
  crop?: { top: number; bottom: number }
}

interface Placed {
  box: Box
  /** Map a source-pixel point (in the uncropped source) onto the canvas. */
  map: (sx: number, sy: number) => { x: number; y: number }
}

/** Place a screenshot, uniformly scaled to fit maxW×maxH, rounded + shadowed, centred at `y`. */
async function placeShot(
  f: Frame,
  shot: Shot,
  y: number,
  maxW: number,
  maxH: number,
  label: string
): Promise<Placed> {
  const src = path.join(SRC, shot.file)
  const meta = await sharp(src).metadata()
  const top = shot.crop?.top ?? 0
  const bottom = shot.crop?.bottom ?? meta.height!
  const cw = meta.width!
  const ch = bottom - top
  const scale = Math.min(maxW / cw, maxH / ch)
  const w = Math.round(cw * scale)
  const h = Math.round(ch * scale)
  const x = Math.round((f.W - w) / 2)
  const radius = 22
  const mask = Buffer.from(
    `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${radius}" fill="#fff"/></svg>`,
    'utf8'
  )
  const img = await sharp(src)
    .extract({ left: 0, top, width: cw, height: ch })
    .resize(w, h, { kernel: 'lanczos3' })
    .ensureAlpha()
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer()
  f.add(
    await card(w, h, { radius, shadow: 0.18, stroke: C.primary200 }),
    x - SHADOW_PAD,
    y - SHADOW_PAD
  )
  f.add(img, x, y)
  const box = { x, y, w, h }
  f.reserve(box, 'image', label)
  return {
    box,
    map: (sx, sy) => ({ x: Math.round(x + sx * scale), y: Math.round(y + (sy - top) * scale) }),
  }
}

async function shotHeight(shot: Shot, maxW: number, maxH: number) {
  const meta = await sharp(path.join(SRC, shot.file)).metadata()
  const ch = (shot.crop?.bottom ?? meta.height!) - (shot.crop?.top ?? 0)
  return Math.round(ch * Math.min(maxW / meta.width!, maxH / ch))
}

/** Callout box placed in free space, arrow ending on `target`. */
async function callout(
  f: Frame,
  text: string,
  fill: string,
  x: number,
  y: number,
  target: { x: number; y: number },
  opts: { step?: number; maxTextWidth?: number } = {}
) {
  const c = await drawCallout({
    text,
    x,
    y,
    fill,
    target,
    step: opts.step,
    maxTextWidth: opts.maxTextWidth ?? 560,
    px: 32,
  })
  for (const l of c.layers) f.add(l.input, l.left, l.top)
  f.reserve(c.box, 'callout', `callout "${text}"`)
  return c.box
}

/** Measure a callout without drawing it. */
async function calloutSize(text: string, maxTextWidth = 560, step?: number) {
  const c = await drawCallout({ text, x: 0, y: 0, fill: C.primary700, maxTextWidth, px: 32, step })
  return { w: c.box.w, h: c.box.h }
}

// ─── Carousel: "So funktioniert's" ───────────────────────────────────────────

// Source-pixel anchors, measured by pixel scan of docs/social-content/source/*
// (re-measure if the captures are retaken):
//   calc-results.png   "28.00 Pkt." ink box x 37–314, y 166–236
//   calc-subjects.png  "Fach hinzufügen" x 909–1111, y 131–157;
//                      rows: labels 186–222, Mathematik 244–380, Deutsch 402–538
//   student-points.png "40.75" x 53–230, y 186–237; label x 136–339, y 63–145
const ANCHOR = {
  resultsTotal: { x: 342, y: 196 }, // empty space just right of "Pkt."
  addSubject: { x: 1010, y: 126 }, // just above the "Fach hinzufügen" link
  pointsTotal: { x: 250, y: 204 }, // just right of "40.75"
  // "Bonuspunkte gesamt" label ink is x 136–339, y 63–145: an arrow into
  // pointsTotal from above clears it only if it starts at x ≥ ~580.
  pointsArrowFromX: 600,
}
const SUBJECT_ROWS_CROP = { top: 176, bottom: 552 } // labels + Mathematik + Deutsch
const SUBJECTS_TOP_CROP = { top: 0, bottom: 552 } // header, link, labels, two rows
// Top row of the stat grid only ("Bonuspunkte gesamt" + average); the gap
// between the grid rows is at y≈402–450. The full 2×2 grid renders too narrow.
const POINTS_TOP_ROW = { top: 0, bottom: 410 }

type Builder = (f: Frame, copy: Copy) => Promise<void>

const carouselHook: Builder = async (f, copy) => {
  const k = copy.carousel.hook
  const band = C.primary700
  const y0 = await header(f, {
    band,
    headline: k.headline,
    subtext: k.subtext,
    headlineMax: f.size.key === 'ig' ? 96 : 92,
    headlineMaxH: 340,
  })
  const shot: Shot = { file: 'calc-results.png' }
  const maxW = f.W - 2 * M
  const cs = await calloutSize(k.callout)
  const swipe = await renderText(k.swipe, FONTS.bold, 36, C.white)
  const swipeH = swipe.height + 40
  const gap = 60
  const shotMaxH = Math.min(400, f.size.contentBottom - y0 - 40 - (cs.h + gap + gap + swipeH))
  const shotH = await shotHeight(shot, maxW, shotMaxH)
  const blockH = cs.h + gap + shotH + gap + swipeH
  let y = y0 + Math.max(40, (f.size.contentBottom - y0 - blockH) / 2)

  const cy = y
  y += cs.h + gap
  const p = await placeShot(f, shot, y, maxW, shotMaxH, 'calculator result')
  const t = p.map(ANCHOR.resultsTotal.x, ANCHOR.resultsTotal.y)
  await callout(f, k.callout, band, Math.min(t.x + 150, f.W - M - cs.w), cy, t)
  y = p.box.y + p.box.h + gap

  const pw = swipe.width + 64
  const px = (f.W - pw) / 2
  f.add(await rect(pw, swipeH, C.secondary700, swipeH / 2), px, y)
  f.text(swipe, px + 32, y + 20, 'swipe')
  await footer(f, copy.url)
}

async function carouselStep(f: Frame, copy: Copy, n: 1 | 2 | 3, band: string) {
  const s = copy.carousel[`step${n}`]
  const y0 = await header(f, {
    band,
    label: s.label,
    step: n,
    headline: s.headline,
    subtext: s.subtext,
  })
  const maxW = f.W - 2 * M
  const cs = await calloutSize(s.callout, 560, n)
  const avail = f.size.contentBottom - y0

  if (n === 1) {
    // Callout above the card, arrow down onto "Fach hinzufügen".
    const shot: Shot = { file: 'calc-subjects.png', crop: SUBJECTS_TOP_CROP }
    const maxH = avail - cs.h - 60 - 50 - 40
    const h = await shotHeight(shot, maxW, maxH)
    const y = y0 + Math.max(40, (avail - (cs.h + 60 + h)) / 2)
    const p = await placeShot(f, shot, y + cs.h + 60, maxW, maxH, 'subjects')
    const t = p.map(ANCHOR.addSubject.x, ANCHOR.addSubject.y)
    await callout(
      f,
      s.callout,
      band,
      Math.max(M, Math.min(t.x - cs.w + 80, f.W - M - cs.w)),
      y,
      t,
      { step: 1 }
    )
  } else if (n === 2) {
    // Grade rows → results, stacked, with a flow chevron between them.
    const rows: Shot = { file: 'calc-subjects.png', crop: SUBJECT_ROWS_CROP }
    const res: Shot = { file: 'calc-results.png' }
    const gap = 70
    // Both shots share one width; shrink it until the stack fits the zone.
    const budget = avail - 40 - gap - 60 - cs.h - 20
    const h0 = (await shotHeight(rows, maxW, 9999)) + (await shotHeight(res, maxW, 9999))
    const w = Math.min(maxW, Math.floor((maxW * budget) / h0))
    const rh = await shotHeight(rows, w, 9999)
    const sh = await shotHeight(res, w, 9999)
    const total = rh + gap + sh + 60 + cs.h
    const y = y0 + Math.max(40, (avail - total) / 2)
    await placeShot(f, rows, y, w, 9999, 'grade rows')
    const chev = await chevronDown(44, band)
    f.add(chev, (f.W - 44) / 2, y + rh + (gap - 44) / 2)
    const p = await placeShot(f, res, y + rh + gap, w, 9999, 'result')
    const t = p.map(ANCHOR.resultsTotal.x, ANCHOR.resultsTotal.y)
    await callout(
      f,
      s.callout,
      band,
      Math.min(t.x + 170, f.W - M - cs.w),
      p.box.y + p.box.h + 60,
      t,
      { step: 2 }
    )
  } else {
    const shot: Shot = { file: 'student-points.png', crop: POINTS_TOP_ROW }
    const maxH = avail - cs.h - 60 - 50 - 40
    const h = await shotHeight(shot, maxW, maxH)
    const y = y0 + Math.max(40, (avail - (cs.h + 60 + h)) / 2)
    const p = await placeShot(f, shot, y + cs.h + 60, maxW, maxH, 'points')
    const t = p.map(ANCHOR.pointsTotal.x, ANCHOR.pointsTotal.y)
    // The connector leaves the box 30px in from its left edge; start it right
    // of the card's "Bonuspunkte gesamt" label so the line never crosses it.
    const fromX = p.map(ANCHOR.pointsArrowFromX, 0).x
    await callout(f, s.callout, band, Math.min(fromX - 30, f.W - M - cs.w), y, t, { step: 3 })
  }
  await footer(f, copy.url)
}

async function chevronDown(d: number, color: string) {
  return svg(`<svg xmlns="http://www.w3.org/2000/svg" width="${d}" height="${d}" viewBox="0 0 24 24">
    <path d="M5 8l7 8 7-8" fill="none" stroke="${color}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`)
}

const carouselCta: Builder = async (f, copy) => {
  const k = copy.carousel.cta
  const band = C.primary700
  const y0 = await header(f, {
    band,
    headline: k.headline,
    subtext: k.subtext,
    headlineMax: 84,
    headlineMaxH: 300,
  })
  const rows: { r: Rendered }[] = []
  for (const p of k.points)
    rows.push({
      r: await renderText(p, FONTS.bold, 40, C.neutral900, { maxWidth: f.W - 2 * M - 180 }),
    })
  const rowH = 96
  const listH = rows.length * rowH
  const btn = await renderTextFit(k.button, FONTS.extrabold, 40, 32, C.white, f.W - 2 * M - 80, 60)
  const btnH = btn.height + 56
  const total = listH + 80 + btnH
  let y = y0 + Math.max(60, (f.size.contentBottom - y0 - total) / 2)

  const cardW = f.W - 2 * M
  f.add(
    await card(cardW, listH + 40, { radius: 28, shadow: 0.14 }),
    M - SHADOW_PAD,
    y - 20 - SHADOW_PAD
  )
  for (const { r } of rows) {
    f.add(await checkIcon(56, C.success600), M + 40, y + (rowH - 56) / 2)
    f.text(r, M + 40 + 56 + 28, y + (rowH - r.height) / 2, 'point')
    y += rowH
  }
  y += 80
  const bw = btn.width + 80
  const bx = (f.W - bw) / 2
  f.add(
    await card(bw, btnH, { fill: C.primary600, radius: btnH / 2, shadow: 0.3 }),
    bx - SHADOW_PAD,
    y - SHADOW_PAD
  )
  f.text(btn, bx + 40, y + 28, 'button')
  await footer(f, copy.url)
}

// ─── Pins ────────────────────────────────────────────────────────────────────

/** Try layout variants from richest to leanest; first one that fits wins. */
async function firstThatFits<T>(
  variants: T[],
  measure: (v: T) => Promise<number>,
  avail: number,
  name: string
) {
  for (const v of variants) {
    if ((await measure(v)) <= avail) return v
  }
  throw new Error(`${name}: no layout variant fits ${avail}px`)
}

const pinTaschengeld: Builder = async (f, copy) => {
  const k = copy.pins.taschengeld
  const band = C.secondary700
  const y0 = await header(f, { band, label: k.label, headline: k.headline, subtext: k.subtext })
  const W = f.W
  const tw = W - 2 * M
  const rowH = f.size.key === 'ig' ? 54 : 48
  const secH = f.size.key === 'ig' ? 60 : 56

  const tips = await Promise.all(
    k.tips.map(async (t) => ({
      title: await renderText(t.title, FONTS.bold, 30, C.neutral900, { maxWidth: tw - 110 }),
      body: await renderText(t.body, FONTS.regular, 28, C.neutral600, { maxWidth: tw - 110 }),
    }))
  )
  const tipsTitle = await renderText(k.tipsTitle, FONTS.extrabold, 34, C.neutral900)
  const tipsH =
    28 +
    tipsTitle.height +
    12 +
    tips.reduce((a, t) => a + t.title.height + 6 + t.body.height + 14, 0) +
    8
  const source = await renderText(k.source, FONTS.regular, 28, C.neutral600, {
    maxWidth: tw,
    align: 'center',
  })
  const tableH = 2 * secH + (DJI_WEEKLY.length + DJI_MONTHLY.length) * rowH
  const cta = await renderTextFit(
    `${k.cta}: ${copy.url}`,
    FONTS.bold,
    34,
    28,
    C.success700,
    tw - 60,
    90,
    { align: 'center' }
  )
  const ctaH = cta.height + 40

  const avail = f.size.contentBottom - y0 - 40
  const variant = await firstThatFits(
    ['tips+cta', 'tips', 'cta', 'bare'] as const,
    async (v) =>
      tableH +
      20 +
      source.height +
      (v === 'tips+cta' || v === 'cta' ? 26 + ctaH : 0) +
      (v === 'tips+cta' || v === 'tips' ? 26 + tipsH : 0),
    avail,
    'taschengeld'
  )
  let y = y0 + 40

  // Table
  f.add(await card(tw, tableH, { radius: 20 }), M - SHADOW_PAD, y - SHADOW_PAD)
  const section = async (
    title: string,
    rows: typeof DJI_WEEKLY,
    max: number,
    pill: string,
    first: boolean
  ) => {
    f.add(await rect(tw, secH, C.neutral900, 0), M, y)
    if (first) f.add(await rect(tw, 20, C.neutral900, 20), M, y) // round the table's top corners
    const t = await renderText(title.toUpperCase(), FONTS.bold, 30, C.white)
    const v = await renderText(k.valueHeader, FONTS.bold, 28, C.primary200)
    f.text(t, M + 24, y + (secH - t.height) / 2, title)
    f.text(v, W - M - 24 - v.width, y + (secH - v.height) / 2, 'value header')
    y += secH
    for (const [i, [ages, amount, upper]] of rows.entries()) {
      if (i % 2) f.add(await rect(tw, rowH, C.neutral50), M, y)
      const a = await renderText(ages, FONTS.bold, 28, C.white)
      const pw = Math.max(a.width + 40, 104)
      const ph = a.height + 10
      f.add(await rect(pw, ph, pill, ph / 2), M + 20, y + (rowH - ph) / 2)
      f.text(a, M + 20 + (pw - a.width) / 2, y + (rowH - a.height) / 2, ages)
      const am = await renderText(amount, FONTS.bold, 32, C.neutral900)
      f.text(am, M + 150, y + (rowH - am.height) / 2, amount)
      const barX = M + 400
      const barW = tw - 400 - 24
      f.add(await rect(barW, 14, C.neutral200, 7), barX, y + rowH / 2 - 7)
      f.add(
        await rect(Math.max(14, Math.round((barW * upper) / max)), 14, pill, 7),
        barX,
        y + rowH / 2 - 7
      )
      y += rowH
    }
  }
  await section(k.weeklyHeader, DJI_WEEKLY, 4, C.success600, true)
  await section(k.monthlyHeader, DJI_MONTHLY, 75, C.primary600, false)
  y += 20
  f.text(source, M + (tw - source.width) / 2, y, 'source')
  y += source.height

  if (variant === 'tips+cta' || variant === 'tips') {
    y += 26
    f.add(await card(tw, tipsH, { radius: 20 }), M - SHADOW_PAD, y - SHADOW_PAD)
    let ty = y + 28
    f.text(tipsTitle, M + 30, ty, 'tips title')
    ty += tipsTitle.height + 12
    const dots = [C.success600, C.primary600, C.warning500]
    for (const [i, t] of tips.entries()) {
      f.add(await circle(22, dots[i]), M + 34, ty + (t.title.height - 22) / 2)
      f.text(t.title, M + 80, ty, 'tip')
      ty += t.title.height + 6
      f.text(t.body, M + 80, ty, 'tip body')
      ty += t.body.height + 14
    }
    y += tipsH
  }
  if (variant === 'tips+cta' || variant === 'cta') {
    y += 26
    f.add(await rect(tw, ctaH, C.success100, 20), M, y)
    f.text(cta, M + (tw - cta.width) / 2, y + 20, 'cta')
  }
  await footer(f, copy.url)
}

const pinZeugnisgeldRegeln: Builder = async (f, copy) => {
  const k = copy.pins.zeugnisgeldRegeln
  const band = C.primary700
  const y0 = await header(f, { band, label: k.label, headline: k.headline, subtext: k.subtext })
  const tw = f.W - 2 * M
  const markerD = 60
  const textX = 30 + markerD + 24
  const textW = tw - textX - 30
  const colors = [C.primary600, C.success600, C.warning500, C.secondary600, C.accent700]
  const rules = await Promise.all(
    k.rules.map(async (r) => ({
      title: await renderText(r.title, FONTS.extrabold, 34, C.neutral900, { maxWidth: textW }),
      body: await renderText(r.body, FONTS.regular, 28, C.neutral700, { maxWidth: textW }),
    }))
  )
  const cardH = (r: (typeof rules)[number], withBody: boolean, pad: number) =>
    Math.max(markerD, r.title.height + (withBody ? 8 + r.body.height : 0)) + pad
  const avail = f.size.contentBottom - y0 - 40
  const [withBody, pad, gap] = await firstThatFits(
    [
      [true, 48, 18],
      [true, 34, 14],
      [true, 26, 10],
      [false, 48, 18],
    ] as const,
    async ([wb, p, g]) => rules.reduce((a, r) => a + cardH(r, wb, p), 0) + g * (rules.length - 1),
    avail,
    'zeugnisgeld-regeln'
  )
  let y = y0 + 40
  for (const [i, r] of rules.entries()) {
    const h = cardH(r, withBody, pad)
    f.add(await card(tw, h, { radius: 20 }), M - SHADOW_PAD, y - SHADOW_PAD)
    const m = await numberMarker(i + 1, markerD, colors[i])
    const textH = r.title.height + (withBody ? 8 + r.body.height : 0)
    f.add(m.buffer, M + 30, y + (h - markerD) / 2)
    f.text(r.title, M + textX, y + (h - textH) / 2, `rule ${i + 1}`)
    if (withBody)
      f.text(r.body, M + textX, y + (h - textH) / 2 + r.title.height + 8, `rule ${i + 1} body`)
    y += h + gap
  }
  await footer(f, copy.url)
}

const pinBelohnungstafel: Builder = async (f, copy) => {
  const k = copy.pins.belohnungstafel
  const band = C.success700
  const y0 = await header(f, {
    band,
    label: k.label,
    headline: k.headline,
    subtext: k.subtext,
    headlineMaxH: 170,
  })
  const W = f.W
  const tw = W - 2 * M
  const rowH = f.size.key === 'ig' ? 46 : 48
  const headH = 60
  const cols = [0, 0.42, 0.6, 0.8].map((c) => M + Math.round(c * tw))
  const nRows = k.subjects.length + 1

  const goal = await renderText(k.goal, FONTS.extrabold, 34, C.neutral900)
  const goalH = goal.height + 60
  const digital = await renderTextFit(
    `${k.digital}: ${copy.url}`,
    FONTS.bold,
    32,
    28,
    C.secondary700,
    tw - 60,
    80
  )
  const digitalH = digital.height + 36
  const howTitle = await renderText(k.howTitle, FONTS.extrabold, 32, C.neutral900)
  const how = await Promise.all(
    k.how.map((h) => renderText(h, FONTS.regular, 30, C.neutral900, { maxWidth: tw - 130 }))
  )
  const howH = 30 + howTitle.height + 12 + how.reduce((a, h) => a + h.height + 10, 0) + 14
  const tableH = headH + nRows * rowH + rowH + 10

  const avail = f.size.contentBottom - y0 - 36
  const variant = await firstThatFits(
    ['full', 'how', 'no-how', 'table+goal'] as const,
    async (v) =>
      tableH +
      26 +
      goalH +
      (v === 'full' || v === 'no-how' ? 26 + digitalH : 0) +
      (v === 'full' || v === 'how' ? 26 + howH : 0),
    avail,
    'belohnungstafel'
  )
  let y = y0 + 36

  f.add(await card(tw, tableH, { radius: 20 }), M - SHADOW_PAD, y - SHADOW_PAD)
  f.add(await rect(tw, headH, C.neutral900, 20), M, y)
  f.add(await rect(tw, 20, C.neutral900), M, y + headH - 20)
  for (const [i, c] of k.columns.entries()) {
    const t = await renderText(c, FONTS.bold, 30, C.white)
    f.text(t, cols[i] + 20, y + (headH - t.height) / 2, c)
  }
  y += headH
  const line = async (x0: number, x1: number, yy: number, color: string) =>
    f.add(await dashedLine(x1 - x0, color), x0, yy)
  for (let i = 0; i < nRows; i++) {
    if (i % 2 === 0) f.add(await rect(tw, rowH, C.success50), M, y)
    const name = k.subjects[i]
    if (name) {
      const t = await renderText(name, FONTS.regular, 30, C.neutral900)
      f.text(t, cols[0] + 20, y + (rowH - t.height) / 2, name)
    }
    for (let c = 1; c < 4; c++)
      await line(cols[c] + 16, (cols[c + 1] ?? M + tw) - 16, y + rowH - 12, C.neutral300)
    y += rowH
  }
  f.add(await rect(tw, rowH + 10, C.success100, 0), M, y)
  const tot = await renderText(k.total, FONTS.extrabold, 32, C.neutral900)
  f.text(tot, cols[0] + 20, y + (rowH + 10 - tot.height) / 2, 'total')
  for (let c = 2; c < 4; c++)
    await line(cols[c] + 16, (cols[c + 1] ?? M + tw) - 16, y + rowH - 6, C.success700)
  y += rowH + 10 + 26

  f.add(
    await card(tw, goalH, { fill: C.warning100, radius: 20, stroke: C.warning500 }),
    M - SHADOW_PAD,
    y - SHADOW_PAD
  )
  f.text(goal, M + 30, y + 22, 'goal')
  await line(M + 30, M + tw - 30, y + goalH - 22, C.warning800)
  y += goalH + 26

  if (variant === 'full' || variant === 'no-how') {
    f.add(await rect(tw, digitalH, C.secondary100, 18), M, y)
    f.text(digital, M + 30, y + 18, 'digital')
    y += digitalH
  }

  if (variant === 'full' || variant === 'how') {
    y += 26
    f.add(await card(tw, howH, { radius: 20 }), M - SHADOW_PAD, y - SHADOW_PAD)
    let hy = y + 30
    f.text(howTitle, M + 30, hy, 'how title')
    hy += howTitle.height + 12
    for (const [i, h] of how.entries()) {
      const m = await numberMarker(i + 1, 46, C.success700)
      f.add(m.buffer, M + 30, hy + (h.height - 46) / 2)
      f.text(h, M + 96, hy, 'how')
      hy += h.height + 10
    }
  }
  await footer(f, copy.url)
}

const pinEinschulung: Builder = async (f, copy) => {
  const k = copy.pins.einschulung
  const band = C.secondary700
  const y0 = await header(f, { band, label: k.label, headline: k.headline, subtext: k.subtext })
  const tw = f.W - 2 * M
  const render = async (px: number) => ({
    items: await Promise.all(
      k.items.map((t) => renderText(t, FONTS.regular, px, C.neutral900, { maxWidth: tw - 110 }))
    ),
    hlTitle: await renderText(k.highlight.title, FONTS.bold, px, C.neutral900, {
      maxWidth: tw - 110,
    }),
    hlBody: await renderText(`→ ${k.highlight.body}`, FONTS.semibold, 28, C.success700, {
      maxWidth: tw - 110,
    }),
  })
  const cta = await renderText(`${k.cta}: ${copy.url}`, FONTS.bold, 34, C.success700)
  const ctaH = cta.height + 40

  const avail = f.size.contentBottom - y0 - 36
  const byPx = { 30: await render(30), 28: await render(28) }
  const measure = (px: 30 | 28, rowPad: number, gap: number, withCta: boolean) => {
    const r = byPx[px]
    return (
      r.items.reduce((a, t) => a + t.height + rowPad + gap, 0) +
      r.hlTitle.height +
      6 +
      r.hlBody.height +
      rowPad +
      gap +
      (withCta ? 16 + ctaH : 0)
    )
  }
  const [px, rowPad, gap, withCta] = await firstThatFits(
    [
      [30, 30, 12, true],
      [30, 22, 10, true],
      [30, 22, 10, false],
      [28, 18, 8, false],
      [28, 14, 6, false],
    ] as const,
    async ([x, p, g, c]) => measure(x, p, g, c),
    avail,
    'einschulung'
  )
  const { items, hlTitle, hlBody } = byPx[px]
  let y = y0 + 36
  const row = async (h: number, highlight: boolean) => {
    if (highlight)
      f.add(
        await card(tw, h, { fill: C.success50, radius: 16, stroke: C.success600, shadow: 0.1 }),
        M - SHADOW_PAD,
        y - SHADOW_PAD
      )
    else f.add(await card(tw, h, { radius: 16, shadow: 0.1 }), M - SHADOW_PAD, y - SHADOW_PAD)
  }
  for (const [i, t] of items.entries()) {
    if (i === k.highlightIndex) {
      const h = hlTitle.height + 6 + hlBody.height + rowPad
      await row(h, true)
      f.add(await checkIcon(40, C.success600), M + 26, y + rowPad / 2 + (hlTitle.height - 40) / 2)
      f.text(hlTitle, M + 86, y + rowPad / 2, 'highlight')
      f.text(hlBody, M + 86, y + rowPad / 2 + hlTitle.height + 6, 'highlight body')
      y += h + gap
    }
    const h = t.height + rowPad
    await row(h, false)
    f.add(await checkbox(36, C.secondary600), M + 28, y + (h - 36) / 2)
    f.text(t, M + 86, y + rowPad / 2, `item ${i}`)
    y += h + gap
  }
  if (withCta) {
    y += 16
    f.add(await rect(tw, ctaH, C.success100, 20), M, y)
    f.text(cta, M + (tw - cta.width) / 2, y + 20, 'cta')
  }
  await footer(f, copy.url)
}

/** Speech bubble: rounded rect + tail, wrapped text. */
async function bubble(
  f: Frame,
  text: string,
  x: number,
  y: number,
  maxW: number,
  fill: string,
  tailLeft: boolean
) {
  const t = await renderText(text, FONTS.semibold, 30, C.white, { maxWidth: maxW - 48 })
  const w = t.width + 48
  const h = t.height + 36
  f.add(await card(w, h, { fill, radius: 22, shadow: 0.18 }), x - SHADOW_PAD, y - SHADOW_PAD)
  const tail = await svg(`<svg xmlns="http://www.w3.org/2000/svg" width="28" height="22">
    <polygon points="${tailLeft ? '0,0 28,0 6,22' : '0,0 28,0 22,22'}" fill="${fill}"/></svg>`)
  f.add(tail, tailLeft ? x + 26 : x + w - 54, y + h - 2)
  f.text(t, x + 24, y + 18, `bubble "${text}"`)
  return { w, h }
}

async function sectionLabel(f: Frame, text: string, color: string, y: number) {
  const t = await renderText(text.toUpperCase(), FONTS.extrabold, 30, color)
  f.text(t, M, y, text)
  return t
}

// Before/after pins share the "Nachher" half: section label + callout on one
// row, then the real screenshot as wide as the remaining height allows, then
// the caption. The "Vorher" half is laid out first, in the leanest variant
// that still leaves the screenshot at least MIN_SHOT_W of the frame width.
async function afterHalf(
  f: Frame,
  y: number,
  o: {
    label: string
    caption: string
    callout: string
    shot: Shot
    target: { x: number; y: number }
  }
) {
  const tw = f.W - 2 * M
  f.add(await rect(tw, 3, C.primary200), M, y - 18)
  const after = await sectionLabel(f, o.label, C.success700, y)
  const ac = await renderTextFit(o.caption, FONTS.extrabold, 38, 30, C.neutral900, tw, 110)
  const cs = await calloutSize(o.callout, 440)
  const labelRowH = Math.max(after.height, cs.h)
  const shotTop = y + labelRowH + 28
  const maxH = f.size.contentBottom - shotTop - 24 - ac.height
  const p = await placeShot(f, o.shot, shotTop, tw, maxH, o.label)
  const t = p.map(o.target.x, o.target.y)
  await callout(f, o.callout, C.success700, f.W - M - cs.w, y + (after.height - cs.h) / 2, t, {
    maxTextWidth: 440,
  })
  f.text(ac, M, p.box.y + p.box.h + 24, 'after caption')
}

/** Height the "Nachher" half needs with its screenshot at the minimum legible width. */
async function afterHalfMinH(f: Frame, caption: string, callout: string, shot: Shot) {
  const tw = f.W - 2 * M
  const ac = await renderTextFit(caption, FONTS.extrabold, 38, 30, C.neutral900, tw, 110)
  const cs = await calloutSize(callout, 440)
  const minW = Math.ceil(MIN_SHOT_W * f.W) + 4
  return Math.max(37, cs.h) + 28 + (await shotHeight(shot, minW, 9999)) + 24 + ac.height
}

const pinBaDiskussion: Builder = async (f, copy) => {
  const k = copy.pins.baDiskussion
  const y0 = await header(f, { band: C.primary700, label: k.label, headline: k.headline })
  const tw = f.W - 2 * M
  const colW = (tw - 24) / 2
  const shot: Shot = { file: 'calc-results.png' }
  const bubbleH = await Promise.all(
    k.bubbles.map(
      async (b) =>
        (await renderText(b, FONTS.semibold, 30, C.white, { maxWidth: colW - 48 })).height + 36
    )
  )
  const bc = await renderText(k.beforeCaption, FONTS.regular, 30, C.neutral600)
  const labelH = 37 + 18
  const beforeH = (stagger: number, rowGap: number, caption: boolean) => {
    let h = labelH
    for (let i = 0; i < bubbleH.length; i += 2) {
      h += Math.max(bubbleH[i], (bubbleH[i + 1] ?? 0) + stagger) + 22
      if (i + 2 < bubbleH.length) h += rowGap
    }
    return h + (caption ? 14 + bc.height : 0) + 40
  }
  const avail =
    f.size.contentBottom - (y0 + 34) - (await afterHalfMinH(f, k.afterCaption, k.callout, shot))
  const [stagger, rowGap, withCaption] = await firstThatFits(
    [
      [24, 26, true],
      [0, 16, true],
      [0, 14, false],
    ] as const,
    async ([s, g, c]) => beforeH(s, g, c),
    avail,
    'ba-diskussion'
  )

  let y = y0 + 34
  await sectionLabel(f, k.before, C.error700, y)
  y += labelH
  const reds = [C.error600, C.error700, C.error600, C.error700]
  for (let i = 0; i < k.bubbles.length; i += 2) {
    let rowH = 0
    for (let c = 0; c < 2 && i + c < k.bubbles.length; c++) {
      const by = y + (c === 1 ? stagger : 0)
      const b = await bubble(
        f,
        k.bubbles[i + c],
        M + c * (colW + 24),
        by,
        colW,
        reds[i + c],
        c === 0
      )
      rowH = Math.max(rowH, by - y + b.h)
    }
    y += rowH + 22
    if (i + 2 < k.bubbles.length) y += rowGap
  }
  if (withCaption) {
    y += 14
    f.text(bc, M, y, 'before caption')
    y += bc.height
  }
  y += 40
  await afterHalf(f, y, {
    label: k.after,
    caption: k.afterCaption,
    callout: k.callout,
    shot,
    target: { x: ANCHOR.resultsTotal.x + 40, y: ANCHOR.resultsTotal.y - 20 },
  })
  await footer(f, copy.url)
}

const pinBaMotivation: Builder = async (f, copy) => {
  const k = copy.pins.baMotivation
  const y0 = await header(f, { band: C.primary700, label: k.label, headline: k.headline })
  const tw = f.W - 2 * M
  const shot: Shot = { file: 'student-points.png', crop: POINTS_TOP_ROW }

  const rcW = Math.round(tw * 0.56)
  const colW = tw - rcW - 30
  const title = await renderText(k.reportTitle, FONTS.regular, 28, C.neutral600)
  const lines = await Promise.all(
    k.report.map(async ([s, g], i) => ({
      s: await renderText(s, FONTS.bold, 32, C.neutral900),
      g: await renderText(g, FONTS.extrabold, 44, [C.error600, C.warning500, C.success600][i]),
    }))
  )
  const bc = await renderText(k.beforeCaption, FONTS.regular, 30, C.neutral600, { maxWidth: colW })
  const labelH = 37 + 18
  const rcH = (lineH: number, padY: number) =>
    padY + title.height + 8 + lines.length * lineH + padY - 10
  const avail =
    f.size.contentBottom - (y0 + 34) - (await afterHalfMinH(f, k.afterCaption, k.callout, shot))
  const [lineH, padY] = await firstThatFits(
    [
      [58, 28],
      [50, 22],
      [46, 18],
    ] as const,
    async ([l, p]) => labelH + rcH(l, p) + 40,
    avail,
    'ba-motivation'
  )

  let y = y0 + 34
  await sectionLabel(f, k.before, C.error700, y)
  y += labelH
  const h = rcH(lineH, padY)
  f.add(await card(rcW, h, { radius: 18 }), M - SHADOW_PAD, y - SHADOW_PAD)
  f.text(title, M + 28, y + padY, 'report title')
  let ly = y + padY + title.height + 8
  for (const [i, l] of lines.entries()) {
    f.text(l.s, M + 28, ly + (lineH - l.s.height) / 2, 'report subject')
    f.text(l.g, M + rcW - 28 - l.g.width, ly + (lineH - l.g.height) / 2, 'report grade')
    if (i < lines.length - 1) f.add(await rect(rcW - 56, 2, C.neutral200), M + 28, ly + lineH - 1)
    ly += lineH
  }
  // Shrug bubble and caption share the column to the right of the report card.
  const bx = M + rcW + 30
  const b = await bubble(f, k.bubble, bx, y + 10, colW, C.error600, true)
  f.text(bc, bx, y + 10 + b.h + 40, 'before caption')
  y += Math.max(h, 10 + b.h + 40 + bc.height) + 40

  await afterHalf(f, y, {
    label: k.after,
    caption: k.afterCaption,
    callout: k.callout,
    shot,
    target: { x: ANCHOR.pointsTotal.x, y: ANCHOR.pointsTotal.y - 20 },
  })
  await footer(f, copy.url)
}

// ─── Entry ───────────────────────────────────────────────────────────────────

async function renderFixture(): Promise<string> {
  const W = 1600
  const rows: Layer[] = []
  let y = 40
  const title = await renderText(
    'Diacritics regression fixture — bundled Geist via Pango (scripts/social/render.ts)',
    FONTS.semibold,
    28,
    C.neutral600
  )
  rows.push({ input: title.buffer, top: y, left: 40 })
  y += title.height + 30
  const weights = [
    ['Regular', FONTS.regular],
    ['SemiBold', FONTS.semibold],
    ['Bold', FONTS.bold],
    ['ExtraBold', FONTS.extrabold],
  ] as const
  for (const [name, font] of weights) {
    for (const px of [56, 28]) {
      const label = await renderText(`${name} ${px}px`, FONTS.regular, 28, C.primary700)
      const sample = await renderText(DIACRITICS_FIXTURE, font, px, C.neutral900, {
        maxWidth: W - 80,
      })
      rows.push({ input: label.buffer, top: y, left: 40 })
      y += label.height + 8
      rows.push({ input: sample.buffer, top: y, left: 40 })
      y += sample.height + 28
    }
  }
  const out = path.join(OUT, 'diacritics-regression-fixture.png')
  await sharp({ create: { width: W, height: y + 20, channels: 3, background: C.white } })
    .composite(rows)
    .png()
    .toFile(out)
  return out
}

interface Job {
  name: string
  build: Builder
  out: (size: SizeKey) => string
}

function jobs(locale: Locale): Job[] {
  // German is the primary market; other locales get a suffixed directory.
  const suffix = locale === 'de' ? '' : `-${locale}`
  const carousel = (n: string) => (s: SizeKey) =>
    path.join(OUT, 'carousels', `so-funktionierts-v2${suffix}`, s, `${n}.png`)
  const pin = (n: string) => (s: SizeKey) => path.join(OUT, `pins${suffix}`, s, `${n}.png`)
  return [
    { name: 'carousel 01 hook', build: carouselHook, out: carousel('01_hook') },
    {
      name: 'carousel 02 step1',
      build: (f, c) => carouselStep(f, c, 1, C.secondary700),
      out: carousel('02_schritt1'),
    },
    {
      name: 'carousel 03 step2',
      build: (f, c) => carouselStep(f, c, 2, C.primary600),
      out: carousel('03_schritt2'),
    },
    {
      name: 'carousel 04 step3',
      build: (f, c) => carouselStep(f, c, 3, C.accent700),
      out: carousel('04_schritt3'),
    },
    { name: 'carousel 05 cta', build: carouselCta, out: carousel('05_cta') },
    { name: 'pin taschengeldtabelle', build: pinTaschengeld, out: pin('pin_taschengeldtabelle') },
    {
      name: 'pin zeugnisgeld_regeln',
      build: pinZeugnisgeldRegeln,
      out: pin('pin_zeugnisgeld_regeln'),
    },
    {
      name: 'pin belohnungstafel',
      build: pinBelohnungstafel,
      out: pin('pin_belohnungstafel_vorlage'),
    },
    { name: 'pin einschulung', build: pinEinschulung, out: pin('pin_einschulung_checkliste') },
    { name: 'pin ba_diskussion', build: pinBaDiskussion, out: pin('pin_ba_diskussion') },
    { name: 'pin ba_motivation', build: pinBaMotivation, out: pin('pin_ba_motivation') },
  ]
}

async function main() {
  const args = process.argv.slice(2)
  const only = args.find((a) => !a.startsWith('--'))
  const locale = (args.find((a) => a.startsWith('--locale='))?.split('=')[1] ?? 'de') as Locale
  const copy = COPY[locale]
  if (!copy) throw new Error(`No copy for locale "${locale}" in scripts/social/copy.ts`)
  assertNoTransliteration(locale, copy)

  console.log('fixture →', path.relative(ROOT, await renderFixture()))
  if (only === 'fixture') return

  for (const job of jobs(locale)) {
    if (only && !job.name.includes(only)) continue
    for (const size of SIZES) {
      const f = new Frame(size)
      await job.build(f, copy)
      const file = job.out(size.key)
      await f.write(file, job.name)
      console.log(`${size.key.padEnd(3)} ${size.W}×${size.H}  ${path.relative(ROOT, file)}`)
    }
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
