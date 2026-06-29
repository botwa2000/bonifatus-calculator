import { SignJWT, jwtVerify } from 'jose'

const secret = new TextEncoder().encode(
  process.env.MOBILE_JWT_SECRET ?? 'dev-fallback-do-not-use-in-prod'
)

export interface MobileTokenPayload {
  userId: string
  role: 'parent' | 'child' | 'admin'
  email: string
}

export async function signMobileToken(payload: MobileTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret)
}

export async function verifyMobileToken(token: string): Promise<MobileTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as MobileTokenPayload
  } catch {
    return null
  }
}
