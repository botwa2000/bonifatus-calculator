import { SignJWT, jwtVerify } from 'jose'

export interface MobileTokenPayload {
  userId: string
  role: 'parent' | 'child' | 'admin'
  email: string
}

function getSecret(): Uint8Array {
  const s = process.env.MOBILE_JWT_SECRET
  if (!s && process.env.NODE_ENV === 'production') {
    throw new Error('MOBILE_JWT_SECRET must be set in production')
  }
  return new TextEncoder().encode(s ?? 'dev-fallback-do-not-use-in-prod')
}

export async function signMobileToken(payload: MobileTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getSecret())
}

export async function verifyMobileToken(token: string): Promise<MobileTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as MobileTokenPayload
  } catch {
    return null
  }
}
