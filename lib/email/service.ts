/**
 * Email Service
 * Production-grade email sending using Nodemailer with Netcup SMTP
 * All credentials from environment variables
 */

import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

// Environment validation
const EMAIL_HOST = process.env.EMAIL_HOST
const EMAIL_PORT = process.env.EMAIL_PORT
const EMAIL_SECURE = process.env.EMAIL_SECURE === 'true'
const EMAIL_USER = process.env.EMAIL_USER
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD
const EMAIL_FROM = process.env.EMAIL_FROM || 'no-reply@bonifatus.com'

if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASSWORD) {
  console.error('Missing email configuration. Please check environment variables:')
  console.error('EMAIL_HOST, EMAIL_PORT, EMAIL_SECURE, EMAIL_USER, EMAIL_PASSWORD')
}

// Create reusable transporter
let transporter: Transporter | null = null

function getTransporter(): Transporter {
  if (transporter) {
    return transporter
  }

  if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASSWORD) {
    throw new Error('Email service not configured. Missing environment variables.')
  }

  transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: parseInt(EMAIL_PORT),
    secure: EMAIL_SECURE, // true for 465, false for other ports
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD,
    },
    // Connection timeout
    connectionTimeout: 10000,
    // Socket timeout
    socketTimeout: 10000,
  })

  return transporter
}

/**
 * Email options interface
 */
export interface EmailOptions {
  to: string | string[]
  subject: string
  text: string
  html: string
  replyTo?: string
}

/**
 * Send email via Netcup SMTP
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    console.log('[Email Service] Attempting to send email to:', options.to)
    console.log('[Email Service] Email configuration check:')
    console.log('  - HOST:', EMAIL_HOST ? '✓ Set' : '✗ Missing')
    console.log('  - PORT:', EMAIL_PORT ? '✓ Set' : '✗ Missing')
    console.log('  - USER:', EMAIL_USER ? '✓ Set' : '✗ Missing')
    console.log('  - PASSWORD:', EMAIL_PASSWORD ? '✓ Set' : '✗ Missing')

    const transport = getTransporter()

    const info = await transport.sendMail({
      from: `"Bonifatus" <${EMAIL_FROM}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      text: options.text, // Plain text version
      html: options.html, // HTML version
      replyTo: options.replyTo,
    })

    console.log('[Email Service] ✓ Email sent successfully:', info.messageId)
    console.log('[Email Service] Recipients:', info.accepted)
    console.log('[Email Service] Rejected:', info.rejected)
    return true
  } catch (error) {
    console.error('[Email Service] ✗ Failed to send email:', error)
    if (error instanceof Error) {
      console.error('[Email Service] Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack?.split('\n').slice(0, 3).join('\n'),
      })
    }
    return false
  }
}

/**
 * Verify email configuration (use during startup or health checks)
 */
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    const transport = getTransporter()
    await transport.verify()
    console.log('Email service configured correctly')
    return true
  } catch (error) {
    console.error('Email service configuration error:', error)
    return false
  }
}
