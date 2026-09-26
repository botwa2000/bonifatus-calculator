// Rendering primitives for scripts/make-social-assets.ts.
//
// Architecture follows lalabuba/scripts/social-lib.js: every glyph is rendered
// by Pango (via sharp's `text` input) from a font file bundled in this repo,
// and composited with sharp. SVG is used for shapes only — an SVG containing
// <text> is rejected at runtime, because SVG text resolves fonts through the
// host (the old carousel used `font-family="Segoe UI, Arial"` and shipped
// "Willkuer", "Faecher", "fuer", "Praemien" to a live Instagram account).
//
// Geist is the site's own typeface (app/[locale]/layout.tsx). The bundled
// static TTFs cover Latin-1/Latin Extended and Cyrillic, so all six locales
// render from the same files. Geist has no U+2713 (✓); checkmarks are drawn
// as shapes by checkIcon().
import sharp from 'sharp'
import path from 'path'

const FONT_DIR = path.join(__dirname, 'fonts')

export interface Font {
  /** Pango font description; must match the file's family + weight. */
  desc: string
  file: string
}

export const FONTS = {
  regular: { desc: 'Geist', file: path.join(FONT_DIR, 'Geist-Regular.ttf') },
  semibold: { desc: 'Geist Semi-Bold', file: path.join(FONT_DIR, 'Geist-SemiBold.ttf') },
  bold: { desc: 'Geist Bold', file: path.join(FONT_DIR, 'Geist-Bold.ttf') },
  extrabold: { desc: 'Geist Ultra-Bold', file: path.join(FONT_DIR, 'Geist-ExtraBold.ttf') },
} satisfies Record<string, Font>

/** Nothing on any asset may be rendered smaller than this (feed legibility). */
export const MIN_TEXT_PX = 28

// Brand palette — copied from the @theme tokens in app/globals.css. Do not add
// colours that are not defined there.
export const C = {
  primary50: '#f5f3ff',
  primary100: '#ede9fe',
  primary200: '#ddd6fe',
  primary600: '#7c3aed',
  primary700: '#6d28d9',
  primary800: '#5b21b6',
  secondary50: '#eef2ff',
  secondary100: '#e0e7ff',
  secondary600: '#4f46e5',
  secondary700: '#4338ca',
  accent700: '#a21caf',
  success50: '#f0fdf4',
  success100: '#dcfce7',
  success600: '#16a34a',
  success700: '#15803d',
  warning100: '#fef3c7',
  warning500: '#f59e0b',
  warning800: '#92400e',
  error50: '#fef2f2',
  error100: '#fee2e2',
  error600: '#dc2626',
  error700: '#b91c1c',
  neutral50: '#f9fafb',
  neutral100: '#f3f4f6',
  neutral200: '#e5e7eb',
  neutral300: '#d1d5db',
  neutral500: '#6b7280',
  neutral600: '#4b5563',
  neutral700: '#374151',
  neutral900: '#111827',
  white: '#ffffff',
} as const

// ─── Text ────────────────────────────────────────────────────────────────────

function escMarkup(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export interface Rendered {
  buffer: Buffer
  width: number
  height: number
}

export interface TextOpts {
  maxWidth?: number
  align?: 'left' | 'centre' | 'center' | 'right'
  /** Extra line spacing in px (Pango `spacing`). */
  lineSpacing?: number
}

/**
 * Render text to a tightly-cropped RGBA PNG through Pango, loading `font.file`
 * directly (no host font lookup). Wraps on words when `maxWidth` is given.
 * `px` is the font size in pixels (sharp renders at 72 dpi, so 1pt == 1px).
 */
export async function renderText(
  text: string,
  font: Font,
  px: number,
  color: string,
  { maxWidth, align = 'left', lineSpacing }: TextOpts = {}
): Promise<Rendered> {
  if (px < MIN_TEXT_PX) {
    throw new Error(`text "${text}" requested at ${px}px; minimum is ${MIN_TEXT_PX}px`)
  }
  if (!/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(color)) {
    throw new Error(`renderText colour must be #RRGGBB[AA], got "${color}"`)
  }
  // Pango output is cropped to the *ink* box, so "ace" and "Hgy" come back with
  // different heights and every vertically-centred row gets its own baseline.
  // To normalise, a magenta marker "H" is rendered on an extra line below the
  // text (so it cannot change how the text wraps); its baseline minus one line
  // pitch is the text's last baseline. The marker is then erased and the image
  // re-framed to a fixed line box: LINE_ASCENT above the baseline and
  // LINE_DESCENT below it. Geist's tallest accented capital reaches 0.915em and
  // its deepest descender (Ç) −0.236em.
  const { data, info } = await rawText(
    `<span size="${Math.round(px * 1024)}" foreground="${color}">` +
      `${escMarkup(text.normalize('NFC'))}\n<span foreground="${MARKER}">H</span></span>`,
    font,
    { maxWidth, align, lineSpacing }
  )
  const pitch = await linePitch(font, px, lineSpacing)

  const { width: iw, height: ih } = info
  let baseline = -1
  let x0 = iw
  let x1 = -1
  let y0 = ih
  for (let y = 0; y < ih; y++) {
    for (let x = 0; x < iw; x++) {
      const o = (y * iw + x) * 4
      const a = data[o + 3]
      if (!a) continue
      if (data[o] > 235 && data[o + 1] < 20 && data[o + 2] > 235) {
        if (a > 128) baseline = Math.max(baseline, y + 1)
        data[o + 3] = 0 // erase the marker
      } else {
        x0 = Math.min(x0, x)
        x1 = Math.max(x1, x)
        y0 = Math.min(y0, y)
      }
    }
  }
  if (baseline < 0 || x1 < 0) throw new Error(`could not locate baseline for "${text}"`)
  baseline -= pitch
  const ascent = Math.round(px * LINE_ASCENT)
  const descent = Math.round(px * LINE_DESCENT)
  // Single line: fixed box around the baseline. Wrapped: ink top of the first
  // line, fixed descent below the last baseline.
  const singleLine = baseline - y0 <= ascent
  const top = singleLine ? baseline - ascent : y0
  const bottom = baseline + descent
  const pad = Math.max(0, -top, bottom - ih)
  const width = x1 - x0 + 1
  const height = bottom - top
  // Two pipelines: within one, sharp applies extract() before extend().
  const padded = await sharp(data, { raw: { width: iw, height: ih, channels: 4 } })
    .extend({ top: pad, bottom: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()
  const buffer = await sharp(padded)
    .extract({ left: x0, top: top + pad, width, height })
    .png()
    .toBuffer()
  if (maxWidth && width > maxWidth) {
    throw new Error(`text "${text}" is ${width}px wide, exceeds ${maxWidth}px`)
  }
  return { buffer, width, height }
}

function rawText(markup: string, font: Font, { maxWidth, align = 'left', lineSpacing }: TextOpts) {
  return sharp({
    text: {
      text: markup,
      font: font.desc,
      fontfile: font.file,
      rgba: true,
      align: align === 'centre' ? 'center' : align,
      ...(maxWidth ? { width: Math.floor(maxWidth), wrap: 'word' as const } : {}),
      ...(lineSpacing ? { spacing: lineSpacing } : {}),
    },
  })
    .raw()
    .toBuffer({ resolveWithObject: true })
}

// Distance between consecutive baselines, measured as ink("H\nH") − ink("H").
const pitchCache = new Map<string, number>()
async function linePitch(font: Font, px: number, lineSpacing?: number): Promise<number> {
  const key = `${font.file}|${px}|${lineSpacing ?? 0}`
  const hit = pitchCache.get(key)
  if (hit != null) return hit
  const span = (t: string) =>
    `<span size="${Math.round(px * 1024)}" foreground="#000000">${t}</span>`
  const one = await rawText(span('H'), font, { lineSpacing })
  const two = await rawText(span('H\nH'), font, { lineSpacing })
  const pitch = two.info.height - one.info.height
  pitchCache.set(key, pitch)
  return pitch
}

const MARKER = '#FF00FF' // never a palette colour; see C
const LINE_ASCENT = 0.95
const LINE_DESCENT = 0.26

/**
 * Render `text` at the largest size in [minPx, maxPx] that fits in
 * maxWidth × maxHeight. Throws if even minPx does not fit.
 */
export async function renderTextFit(
  text: string,
  font: Font,
  maxPx: number,
  minPx: number,
  color: string,
  maxWidth: number,
  maxHeight: number,
  opts: Omit<TextOpts, 'maxWidth'> = {}
): Promise<Rendered & { px: number }> {
  for (let px = maxPx; px >= minPx; px -= 2) {
    const r = await renderText(text, font, px, color, { ...opts, maxWidth })
    if (r.height <= maxHeight && (await longestWordFits(text, font, px, maxWidth))) {
      return { ...r, px }
    }
  }
  throw new Error(`"${text}" does not fit ${maxWidth}×${maxHeight} even at ${minPx}px`)
}

// Pango breaks a word that is wider than the wrap width mid-word ("Belohnungs-
// tafel" → "Belohnungsta" / "fel"). Treat that as not fitting.
async function longestWordFits(text: string, font: Font, px: number, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean)
  const longest = words.reduce((a, b) => (b.length > a.length ? b : a), '')
  const r = await renderText(longest, font, px, '#000000')
  return r.width <= maxWidth
}

// ─── Shapes (SVG, never text) ────────────────────────────────────────────────

/** Rasterise an SVG shape. Rejects any SVG containing <text>. */
export async function svg(markup: string): Promise<Buffer> {
  if (/<text[\s>]/i.test(markup)) {
    throw new Error('SVG <text> is forbidden in social assets; use renderText()')
  }
  const doc = `<?xml version="1.0" encoding="UTF-8"?>\n${markup}`
  return sharp(Buffer.from(doc, 'utf8')).png().toBuffer()
}

export const SHADOW_PAD = 28

/** Rounded rect with a soft drop shadow. The returned image is padded by
 *  SHADOW_PAD on every side, so composite it at (x - SHADOW_PAD, y - SHADOW_PAD). */
export async function card(
  w: number,
  h: number,
  { fill = C.white, radius = 24, stroke, shadow = 0.16, opacity = 1 } = {} as {
    fill?: string
    radius?: number
    stroke?: string
    shadow?: number
    opacity?: number
  }
): Promise<Buffer> {
  const p = SHADOW_PAD
  const strokeAttr = stroke ? `stroke="${stroke}" stroke-width="3"` : ''
  return svg(`<svg xmlns="http://www.w3.org/2000/svg" width="${w + 2 * p}" height="${h + 2 * p}">
    <defs><filter id="s" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="9" flood-color="#111827" flood-opacity="${shadow}"/>
    </filter></defs>
    <rect x="${p}" y="${p}" width="${w}" height="${h}" rx="${radius}" fill="${fill}"
      fill-opacity="${opacity}" ${strokeAttr} filter="url(#s)"/>
  </svg>`)
}

export async function rect(w: number, h: number, fill: string, radius = 0): Promise<Buffer> {
  return svg(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <rect width="${w}" height="${h}" rx="${radius}" fill="${fill}"/></svg>`)
}

export async function circle(d: number, fill: string, ring?: string): Promise<Buffer> {
  const r = d / 2
  const ringAttr = ring ? `stroke="${ring}" stroke-width="4"` : ''
  return svg(`<svg xmlns="http://www.w3.org/2000/svg" width="${d}" height="${d}">
    <circle cx="${r}" cy="${r}" r="${r - 3}" fill="${fill}" ${ringAttr}/></svg>`)
}

/** Filled circle with a white tick, drawn as a path (Geist has no ✓ glyph). */
export async function checkIcon(d: number, fill: string): Promise<Buffer> {
  return svg(`<svg xmlns="http://www.w3.org/2000/svg" width="${d}" height="${d}" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="11.5" fill="${fill}"/>
    <path d="M6.8 12.4l3.4 3.4 7-7.4" fill="none" stroke="#ffffff" stroke-width="2.6"
      stroke-linecap="round" stroke-linejoin="round"/></svg>`)
}

/** Empty rounded checkbox outline. */
export async function checkbox(d: number, stroke: string): Promise<Buffer> {
  return svg(`<svg xmlns="http://www.w3.org/2000/svg" width="${d}" height="${d}">
    <rect x="2" y="2" width="${d - 4}" height="${d - 4}" rx="${d * 0.22}" fill="#ffffff"
      stroke="${stroke}" stroke-width="3"/></svg>`)
}

export async function dashedLine(w: number, color: string, thickness = 3): Promise<Buffer> {
  return svg(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${thickness}">
    <line x1="0" y1="${thickness / 2}" x2="${w}" y2="${thickness / 2}" stroke="${color}"
      stroke-width="${thickness}" stroke-dasharray="10 8"/></svg>`)
}

// ─── Composition ─────────────────────────────────────────────────────────────

export interface Layer {
  input: Buffer
  left: number
  top: number
}

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

/** Numbered step marker: brand circle with a white numeral from the bundled font. */
export async function numberMarker(n: number, d: number, fill: string): Promise<Rendered> {
  const num = await renderText(
    String(n),
    FONTS.extrabold,
    Math.max(MIN_TEXT_PX, Math.round(d * 0.5)),
    C.white
  )
  const buffer = await sharp(await circle(d, fill, C.white))
    .composite([
      {
        input: num.buffer,
        left: Math.round((d - num.width) / 2),
        top: Math.round((d - num.height) / 2),
      },
    ])
    .png()
    .toBuffer()
  return { buffer, width: d, height: d }
}

export interface CalloutOpts {
  text: string
  /** Top-left of the callout box on the canvas. */
  x: number
  y: number
  maxTextWidth: number
  fill: string
  textColor?: string
  px?: number
  /** Numbered marker drawn at the box's left edge. */
  step?: number
  /** Canvas point the callout points at (the UI element being described). */
  target?: { x: number; y: number }
}

/**
 * Callout: an opaque rounded box with a drop shadow and a label, plus a
 * connector that ends in an arrowhead on `target`. Returns composite layers
 * and the box rect so callers can assert it does not overlap anything.
 */
export async function drawCallout(o: CalloutOpts): Promise<{ layers: Layer[]; box: Box }> {
  const { text, x, y, maxTextWidth, fill, textColor = C.white, px = 32, step, target } = o
  const label = await renderText(text, FONTS.bold, px, textColor, { maxWidth: maxTextWidth })
  const markerD = step != null ? Math.max(56, label.height + 12) : 0
  const padX = 28
  const padY = 20
  const innerLeft = step != null ? markerD + 16 : 0
  const w = innerLeft + label.width + padX * 2
  const h = Math.max(label.height, markerD) + padY * 2
  const layers: Layer[] = []

  if (target) layers.push(await connector({ x, y, w, h }, target, fill))

  layers.push({
    input: await card(w, h, { fill, radius: 20, shadow: 0.28 }),
    left: x - SHADOW_PAD,
    top: y - SHADOW_PAD,
  })
  if (step != null) {
    const m = await numberMarker(step, markerD, fill)
    layers.push({ input: m.buffer, left: x + padX - 6, top: y + Math.round((h - markerD) / 2) })
  }
  layers.push({
    input: label.buffer,
    left: x + padX + innerLeft,
    top: y + Math.round((h - label.height) / 2),
  })
  return { layers, box: { x, y, w, h } }
}

// Line from the nearest edge of the callout box to the target, with a solid
// arrowhead touching the target and a white halo so it reads on any background.
async function connector(box: Box, t: { x: number; y: number }, color: string): Promise<Layer> {
  const cx = Math.min(Math.max(t.x, box.x + 30), box.x + box.w - 30)
  const cy = Math.min(Math.max(t.y, box.y + 20), box.y + box.h - 20)
  // Leave the box from the edge that faces the target.
  const from =
    t.y > box.y + box.h
      ? { x: cx, y: box.y + box.h }
      : t.y < box.y
        ? { x: cx, y: box.y }
        : t.x > box.x + box.w
          ? { x: box.x + box.w, y: cy }
          : { x: box.x, y: cy }
  const minX = Math.min(from.x, t.x) - 30
  const minY = Math.min(from.y, t.y) - 30
  const W = Math.abs(from.x - t.x) + 60
  const H = Math.abs(from.y - t.y) + 60
  const fx = from.x - minX
  const fy = from.y - minY
  const tx = t.x - minX
  const ty = t.y - minY
  const ang = Math.atan2(ty - fy, tx - fx)
  const L = 26
  const spread = 0.5
  const bx = tx - L * Math.cos(ang)
  const by = ty - L * Math.sin(ang)
  const p1 = `${tx - L * Math.cos(ang - spread)},${ty - L * Math.sin(ang - spread)}`
  const p2 = `${tx - L * Math.cos(ang + spread)},${ty - L * Math.sin(ang + spread)}`
  const input = await svg(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <line x1="${fx}" y1="${fy}" x2="${bx}" y2="${by}" stroke="#ffffff" stroke-width="12" stroke-linecap="round"/>
    <polygon points="${tx},${ty} ${p1} ${p2}" fill="#ffffff" stroke="#ffffff" stroke-width="8" stroke-linejoin="round"/>
    <line x1="${fx}" y1="${fy}" x2="${bx}" y2="${by}" stroke="${color}" stroke-width="6" stroke-linecap="round"/>
    <polygon points="${tx},${ty} ${p1} ${p2}" fill="${color}"/>
  </svg>`)
  return { input, left: Math.round(minX), top: Math.round(minY) }
}

export function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
}
