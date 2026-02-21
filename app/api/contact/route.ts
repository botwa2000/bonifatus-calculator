import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email/service'

export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json()

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    // Basic length limits
    if (name.length > 200 || email.length > 200 || subject.length > 500 || message.length > 5000) {
      return NextResponse.json({ error: 'Input too long' }, { status: 400 })
    }

    const sent = await sendEmail({
      to: 'info@bonifatus.com',
      subject: `[Bonifatus Contact] ${subject}`,
      replyTo: email,
      text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Contact Form Submission</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 100px;">Name</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(name)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Email</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Subject</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(subject)}</td>
            </tr>
          </table>
          <div style="margin-top: 16px; padding: 16px; background: #f9f9f9; border-radius: 8px;">
            <p style="white-space: pre-wrap; margin: 0;">${escapeHtml(message)}</p>
          </div>
          <p style="color: #888; font-size: 12px; margin-top: 16px;">Sent via Bonifatus contact form</p>
        </div>
      `,
    })

    if (!sent) {
      return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
