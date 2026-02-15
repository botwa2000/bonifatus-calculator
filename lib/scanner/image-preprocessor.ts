import sharp from 'sharp'

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
