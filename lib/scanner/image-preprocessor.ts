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

  return pipeline.grayscale().sharpen({ sigma: SHARPEN_SIGMA }).normalize().png().toBuffer()
}

/**
 * Detect a vertical gutter in the middle of an image indicating two-column layout.
 * Only analyzes the middle 60% of image height to avoid headers/footers.
 * Returns the x-coordinate of the gutter in original image coordinates, or null.
 */
async function detectColumnGutter(buffer: Buffer): Promise<number | null> {
  const ANALYSIS_WIDTH = 200
  const meta = await sharp(buffer).metadata()
  if (!meta.width || !meta.height) return null

  // Only analyze images wide enough to plausibly have two columns
  if (meta.width < 600) return null

  const analysisHeight = Math.round((meta.height / meta.width) * ANALYSIS_WIDTH)

  const { data, info } = await sharp(buffer)
    .resize(ANALYSIS_WIDTH, analysisHeight)
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const width = info.width
  const height = info.height

  // Only analyze the middle 60% of height (skip headers and footers)
  const yStart = Math.floor(height * 0.2)
  const yEnd = Math.floor(height * 0.8)
  const analyzeHeight = yEnd - yStart
  if (analyzeHeight < 10) return null

  // Calculate average brightness for each column in the analysis region
  const colBrightness: number[] = new Array(width).fill(0)
  for (let x = 0; x < width; x++) {
    let sum = 0
    for (let y = yStart; y < yEnd; y++) {
      sum += data[y * width + x]
    }
    colBrightness[x] = sum / analyzeHeight
  }

  // Look for the brightest vertical band in the middle 30%-70% of width
  const searchStart = Math.floor(width * 0.3)
  const searchEnd = Math.floor(width * 0.7)
  let maxBrightness = 0
  let gutterX = -1

  for (let x = searchStart; x <= searchEnd; x++) {
    // Average over a 5-pixel window for noise resistance
    let windowSum = 0
    let count = 0
    for (let dx = -2; dx <= 2; dx++) {
      const xx = x + dx
      if (xx >= 0 && xx < width) {
        windowSum += colBrightness[xx]
        count++
      }
    }
    const windowAvg = windowSum / count
    if (windowAvg > maxBrightness) {
      maxBrightness = windowAvg
      gutterX = x
    }
  }

  // The gutter must be significantly brighter than average (mostly-white strip)
  const overallAvg = colBrightness.reduce((a, b) => a + b, 0) / width
  const threshold = overallAvg + (255 - overallAvg) * 0.3

  if (maxBrightness > threshold && gutterX > 0) {
    const originalX = Math.round((gutterX / ANALYSIS_WIDTH) * meta.width)
    dbg('scanner', 'column gutter detected', {
      gutterX: originalX,
      imageWidth: meta.width,
      brightness: Math.round(maxBrightness),
      threshold: Math.round(threshold),
    })
    return originalX
  }

  dbg('scanner', 'no column gutter detected', {
    maxBrightness: Math.round(maxBrightness),
    threshold: Math.round(threshold),
  })
  return null
}

/**
 * Split a preprocessed image into left and right halves at the detected gutter.
 * Returns [leftBuffer, rightBuffer] if a two-column layout is detected, or null.
 */
export async function splitColumns(buffer: Buffer): Promise<Buffer[] | null> {
  const gutterX = await detectColumnGutter(buffer)
  if (gutterX === null) return null

  const meta = await sharp(buffer).metadata()
  if (!meta.width || !meta.height) return null

  const overlap = Math.round(meta.width * 0.02) // 2% overlap to avoid cutting text
  const leftWidth = Math.min(gutterX + overlap, meta.width)
  const rightStart = Math.max(gutterX - overlap, 0)
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

  dbg('scanner', 'image split into columns', {
    leftWidth,
    rightStart,
    rightWidth,
    imageHeight: meta.height,
  })

  return [left, right]
}
