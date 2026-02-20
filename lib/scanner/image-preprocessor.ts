import sharp from 'sharp'
import { dbg } from '@/lib/debug'

const TARGET_WIDTH = 2000
const SHARPEN_SIGMA = 1.5

export async function preprocessImage(buffer: Buffer): Promise<Buffer> {
  const image = sharp(buffer)
  const metadata = await image.metadata()

  let pipeline = image.rotate() // Auto-rotate based on EXIF orientation

  // Resize to optimal width for OCR if larger
  if (metadata.width && metadata.width > TARGET_WIDTH) {
    pipeline = pipeline.resize(TARGET_WIDTH, null, { withoutEnlargement: true })
  }

  return pipeline
    .grayscale()
    .sharpen({ sigma: SHARPEN_SIGMA })
    .normalize()
    .threshold(128) // Binarize: clean black text on white background for Tesseract
    .png()
    .toBuffer()
}

/**
 * Detect a vertical gutter in the middle of an image indicating two-column layout.
 * Uses bright-row-percentage: for each column x, counts what fraction of rows are
 * "bright" (white background). This is robust to a few full-width header rows that
 * cross the gutter (e.g. "Pflichtunterricht:", "Wahlpflichtunterricht:").
 * Analyzes only the middle 40% of image height to focus on the content area.
 */
async function detectColumnGutter(buffer: Buffer): Promise<number | null> {
  const ANALYSIS_WIDTH = 200
  const meta = await sharp(buffer).metadata()
  if (!meta.width || !meta.height) return null

  if (meta.width < 600) return null

  const analysisHeight = Math.round((meta.height / meta.width) * ANALYSIS_WIDTH)

  const { data, info } = await sharp(buffer)
    .resize(ANALYSIS_WIDTH, analysisHeight)
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const width = info.width
  const height = info.height

  // Focus on middle 40% of height — avoids header, footer, and title areas
  const yStart = Math.floor(height * 0.3)
  const yEnd = Math.floor(height * 0.7)
  const analyzeHeight = yEnd - yStart
  if (analyzeHeight < 10) return null

  // For each column, calculate what percentage of rows are "bright" (> 180).
  // A gutter between text columns will have most rows bright (white paper),
  // while text columns will have many dark rows (ink).
  const BRIGHT_PIXEL = 180
  const colBrightRatio: number[] = new Array(width).fill(0)
  for (let x = 0; x < width; x++) {
    let brightCount = 0
    for (let y = yStart; y < yEnd; y++) {
      if (data[y * width + x] > BRIGHT_PIXEL) brightCount++
    }
    colBrightRatio[x] = brightCount / analyzeHeight
  }

  // Find the column with highest bright-row ratio in center 30%-70%
  const searchStart = Math.floor(width * 0.3)
  const searchEnd = Math.floor(width * 0.7)
  let maxBrightRatio = 0
  let gutterX = -1

  for (let x = searchStart; x <= searchEnd; x++) {
    // Average over 5-pixel window for noise resistance
    let windowSum = 0
    let count = 0
    for (let dx = -2; dx <= 2; dx++) {
      const xx = x + dx
      if (xx >= 0 && xx < width) {
        windowSum += colBrightRatio[xx]
        count++
      }
    }
    const windowAvg = windowSum / count
    if (windowAvg > maxBrightRatio) {
      maxBrightRatio = windowAvg
      gutterX = x
    }
  }

  // Average bright ratio across all columns
  const avgBrightRatio = colBrightRatio.reduce((a, b) => a + b, 0) / width

  // Gutter criteria: > 75% of rows are bright AND at least 10% more than average
  if (maxBrightRatio > 0.75 && maxBrightRatio > avgBrightRatio + 0.1 && gutterX > 0) {
    const originalX = Math.round((gutterX / ANALYSIS_WIDTH) * meta.width)
    dbg('scanner', 'column gutter detected', {
      gutterX: originalX,
      imageWidth: meta.width,
      brightRatio: Math.round(maxBrightRatio * 100) + '%',
      avgBrightRatio: Math.round(avgBrightRatio * 100) + '%',
    })
    return originalX
  }

  dbg('scanner', 'no column gutter detected', {
    maxBrightRatio: Math.round(maxBrightRatio * 100) + '%',
    avgBrightRatio: Math.round(avgBrightRatio * 100) + '%',
  })
  return null
}

/** Internal: split an image at a given x-coordinate with overlap */
async function splitAtX(buffer: Buffer, x: number): Promise<Buffer[] | null> {
  const meta = await sharp(buffer).metadata()
  if (!meta.width || !meta.height) return null

  const overlap = Math.round(meta.width * 0.02)
  const leftWidth = Math.min(x + overlap, meta.width)
  const rightStart = Math.max(x - overlap, 0)
  const rightWidth = meta.width - rightStart

  if (leftWidth < 100 || rightWidth < 100) return null

  const [left, right] = await Promise.all([
    sharp(buffer)
      .extract({ left: 0, top: 0, width: leftWidth, height: meta.height })
      .png()
      .toBuffer(),
    sharp(buffer)
      .extract({ left: rightStart, top: 0, width: rightWidth, height: meta.height })
      .png()
      .toBuffer(),
  ])

  return [left, right]
}

/**
 * Detect two-column layout via gutter analysis and split if found.
 * Returns [leftBuffer, rightBuffer] or null.
 */
export async function splitColumns(buffer: Buffer): Promise<Buffer[] | null> {
  const gutterX = await detectColumnGutter(buffer)
  if (gutterX === null) return null

  const result = await splitAtX(buffer, gutterX)
  if (result) {
    dbg('scanner', 'image split at detected gutter', { gutterX })
  }
  return result
}

/**
 * Force split at center — used as fallback when smart detection fails
 * but OCR of the full image yields too few subjects.
 */
export async function forceSplitCenter(buffer: Buffer): Promise<Buffer[] | null> {
  const meta = await sharp(buffer).metadata()
  if (!meta.width || !meta.height || meta.width < 600) return null

  const centerX = Math.round(meta.width / 2)
  const result = await splitAtX(buffer, centerX)
  if (result) {
    dbg('scanner', 'forced center split', { centerX, imageWidth: meta.width })
  }
  return result
}
