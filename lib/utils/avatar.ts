import sharp from 'sharp'

export function getAvatarPath(userId: string): string {
  return `uploads/avatars/${userId}.webp`
}

export function getAvatarUrl(userId: string): string {
  return `/api/profile/avatar/${userId}`
}

export async function processAvatar(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer).resize(256, 256, { fit: 'cover' }).webp({ quality: 80 }).toBuffer()
}
