/**
 * Password Validation Utilities
 * Production-grade password strength checking with breach detection
 */

/**
 * Password requirements as per SECURITY.md
 */
export const PASSWORD_REQUIREMENTS = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecial: true,
} as const

/**
 * Password strength levels
 */
export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong' | 'very-strong'

/**
 * Password validation result
 */
export interface PasswordValidationResult {
  isValid: boolean
  strength: PasswordStrength
  score: number // 0-100
  feedback: string[]
  errors: string[]
}

/**
 * Check if password meets minimum requirements
 */
export function meetsMinimumRequirements(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`)
  }

  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (PASSWORD_REQUIREMENTS.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (PASSWORD_REQUIREMENTS.requireSpecial && !/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Calculate password strength score (0-100)
 */
export function calculatePasswordStrength(password: string): {
  score: number
  strength: PasswordStrength
  feedback: string[]
} {
  let score = 0
  const feedback: string[] = []

  // Length scoring (0-30 points)
  if (password.length >= 12) score += 15
  if (password.length >= 16) score += 10
  if (password.length >= 20) score += 5
  if (password.length < 12) {
    feedback.push('Use at least 12 characters for better security')
  }

  // Character variety scoring (0-40 points)
  const hasLower = /[a-z]/.test(password)
  const hasUpper = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[^A-Za-z0-9]/.test(password)

  if (hasLower) score += 10
  if (hasUpper) score += 10
  if (hasNumber) score += 10
  if (hasSpecial) score += 10

  const varietyCount = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length
  if (varietyCount < 4) {
    feedback.push('Use a mix of uppercase, lowercase, numbers, and special characters')
  }

  // Pattern detection (0-30 points)
  // Penalize common patterns
  const commonPatterns = [
    /^(.)\1+$/, // Repeating character
    /^(012|123|234|345|456|567|678|789|890)+/, // Sequential numbers
    /^(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)+/i, // Sequential letters
    /^(qwerty|asdfgh|zxcvbn)+/i, // Keyboard patterns
  ]

  const hasPatterns = commonPatterns.some((pattern) => pattern.test(password))
  if (!hasPatterns) {
    score += 30
  } else {
    feedback.push('Avoid common patterns like "12345" or "qwerty"')
  }

  // Determine strength level
  let strength: PasswordStrength
  if (score >= 85) {
    strength = 'very-strong'
    feedback.push('Excellent! Your password is very strong')
  } else if (score >= 70) {
    strength = 'strong'
    feedback.push('Great! Your password is strong')
  } else if (score >= 50) {
    strength = 'good'
    feedback.push('Good password, but could be stronger')
  } else if (score >= 30) {
    strength = 'fair'
    feedback.push('Fair password, consider making it stronger')
  } else {
    strength = 'weak'
    feedback.push('Weak password - please choose a stronger one')
  }

  return { score, strength, feedback }
}

/**
 * Check for common passwords (simple blocklist)
 */
const COMMON_PASSWORDS = new Set([
  'password',
  'password123',
  '12345678',
  '123456789',
  '1234567890',
  'qwerty123',
  'abc123456',
  'password1',
  'password!',
  'letmein123',
  'welcome123',
  'monkey123',
  'dragon123',
  'master123',
  'sunshine123',
])

export function isCommonPassword(password: string): boolean {
  return COMMON_PASSWORDS.has(password.toLowerCase())
}

/**
 * Check if password contains user information
 */
export function containsUserInfo(
  password: string,
  userInfo: {
    email?: string
    name?: string
    username?: string
  }
): boolean {
  const passwordLower = password.toLowerCase()

  if (userInfo.email) {
    const emailPrefix = userInfo.email.split('@')[0].toLowerCase()
    if (emailPrefix.length > 3 && passwordLower.includes(emailPrefix)) {
      return true
    }
  }

  if (userInfo.name) {
    const nameParts = userInfo.name.toLowerCase().split(/\s+/)
    for (const part of nameParts) {
      if (part.length > 3 && passwordLower.includes(part)) {
        return true
      }
    }
  }

  if (userInfo.username) {
    const usernameLower = userInfo.username.toLowerCase()
    if (usernameLower.length > 3 && passwordLower.includes(usernameLower)) {
      return true
    }
  }

  return false
}

/**
 * Check password against Have I Been Pwned API (breach detection)
 * Uses k-anonymity model - only sends first 5 chars of SHA-1 hash
 */
export async function checkPasswordBreach(password: string): Promise<{
  isBreached: boolean
  breachCount: number
}> {
  try {
    // Generate SHA-1 hash of password
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-1', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()

    // Send only first 5 characters to API (k-anonymity)
    const prefix = hashHex.substring(0, 5)
    const suffix = hashHex.substring(5)

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Bonifatus-Password-Check',
      },
    })

    if (!response.ok) {
      // If API fails, allow password but log warning
      console.warn('Have I Been Pwned API unavailable')
      return { isBreached: false, breachCount: 0 }
    }

    const text = await response.text()
    const lines = text.split('\n')

    // Check if our hash suffix appears in results
    for (const line of lines) {
      const [hashSuffix, count] = line.split(':')
      if (hashSuffix.trim() === suffix) {
        return {
          isBreached: true,
          breachCount: parseInt(count.trim(), 10),
        }
      }
    }

    return { isBreached: false, breachCount: 0 }
  } catch (error) {
    console.error('Error checking password breach:', error)
    // On error, allow password (fail open for usability)
    return { isBreached: false, breachCount: 0 }
  }
}

/**
 * Comprehensive password validation
 */
export async function validatePassword(
  password: string,
  userInfo?: {
    email?: string
    name?: string
    username?: string
  }
): Promise<PasswordValidationResult> {
  const errors: string[] = []
  const feedback: string[] = []

  // Check minimum requirements
  const requirements = meetsMinimumRequirements(password)
  errors.push(...requirements.errors)

  // Check for common passwords
  if (isCommonPassword(password)) {
    errors.push('This password is too common - please choose a more unique password')
  }

  // Check for user information in password
  if (userInfo && containsUserInfo(password, userInfo)) {
    errors.push('Password should not contain your email, name, or username')
  }

  // Calculate strength
  const { score, strength, feedback: strengthFeedback } = calculatePasswordStrength(password)
  feedback.push(...strengthFeedback)

  // Check breach database
  const breach = await checkPasswordBreach(password)
  if (breach.isBreached) {
    errors.push(
      `This password has been exposed in ${breach.breachCount.toLocaleString()} data breaches - please choose a different password`
    )
  }

  return {
    isValid: errors.length === 0,
    strength,
    score,
    feedback,
    errors,
  }
}

/**
 * Synchronous validation (without breach check) - for real-time feedback
 */
export function validatePasswordSync(
  password: string,
  userInfo?: {
    email?: string
    name?: string
    username?: string
  }
): Omit<PasswordValidationResult, 'isValid'> & { meetsRequirements: boolean } {
  const errors: string[] = []
  const feedback: string[] = []

  // Check minimum requirements
  const requirements = meetsMinimumRequirements(password)
  errors.push(...requirements.errors)

  // Check for common passwords
  if (isCommonPassword(password)) {
    errors.push('This password is too common')
  }

  // Check for user information
  if (userInfo && containsUserInfo(password, userInfo)) {
    errors.push('Password should not contain your personal information')
  }

  // Calculate strength
  const { score, strength, feedback: strengthFeedback } = calculatePasswordStrength(password)
  feedback.push(...strengthFeedback)

  return {
    meetsRequirements: requirements.isValid,
    strength,
    score,
    feedback,
    errors,
  }
}
