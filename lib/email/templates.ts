/**
 * Email Templates
 * Production-grade HTML email templates with plain text fallbacks
 */

/**
 * Email verification code template
 */
export function getVerificationCodeEmail(
  code: string,
  userName: string,
  expiresInMinutes: number = 15
): { subject: string; text: string; html: string } {
  const subject = 'Verify Your Bonifatus Account'

  const text = `
Hello ${userName},

Thank you for registering with Bonifatus!

Your verification code is: ${code}

This code will expire in ${expiresInMinutes} minutes.

Please enter this code on the verification page to activate your account.

If you didn't create an account with Bonifatus, please ignore this email.

Best regards,
The Bonifatus Team

---
Bonifatus - Motivating Academic Excellence
https://bonifatus.com
  `.trim()

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 0; text-align: center;">
        <table role="presentation" style="width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Bonifatus</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 24px; font-weight: 600;">Verify Your Account</h2>

              <p style="margin: 0 0 20px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Hello ${userName},
              </p>

              <p style="margin: 0 0 30px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Thank you for registering with Bonifatus! To complete your registration, please enter the following verification code:
              </p>

              <!-- Verification Code Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 30px; background-color: #f7fafc; border-radius: 8px; text-align: center;">
                    <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #667eea; font-family: 'Courier New', monospace;">
                      ${code}
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; color: #718096; font-size: 14px; line-height: 1.6;">
                This code will expire in <strong>${expiresInMinutes} minutes</strong>.
              </p>

              <p style="margin: 20px 0 0; color: #718096; font-size: 14px; line-height: 1.6;">
                If you didn't create an account with Bonifatus, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f7fafc; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0 0 10px; color: #718096; font-size: 14px;">
                Best regards,<br>
                <strong>The Bonifatus Team</strong>
              </p>
              <p style="margin: 20px 0 0; color: #a0aec0; font-size: 12px;">
                Bonifatus - Motivating Academic Excellence<br>
                <a href="https://bonifatus.com" style="color: #667eea; text-decoration: none;">bonifatus.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()

  return { subject, text, html }
}

/**
 * Welcome email (sent after successful verification)
 */
export function getWelcomeEmail(
  userName: string,
  userRole: 'parent' | 'child' | 'admin'
): { subject: string; text: string; html: string } {
  const subject = 'Welcome to Bonifatus!'

  const roleSpecificMessage =
    userRole === 'parent'
      ? 'As a parent, you can now set up your reward system, configure bonus factors, and invite your children to join.'
      : 'As a student, you can start tracking your grades and earning bonus points for your achievements!'

  const text = `
Hello ${userName},

Welcome to Bonifatus! 🎉

Your account has been successfully verified and is ready to use.

${roleSpecificMessage}

Get started by completing your profile and exploring the features.

If you have any questions, feel free to reach out to our support team.

Best regards,
The Bonifatus Team

---
Bonifatus - Motivating Academic Excellence
https://bonifatus.com
  `.trim()

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 0; text-align: center;">
        <table role="presentation" style="width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 600;">🎉 Welcome to Bonifatus!</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 24px; font-weight: 600;">Hello ${userName},</h2>

              <p style="margin: 0 0 20px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Your account has been successfully verified and is ready to use!
              </p>

              <p style="margin: 0 0 30px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                ${roleSpecificMessage}
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="text-align: center; padding: 20px 0;">
                    <a href="https://bonifatus.com/dashboard" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      Go to Dashboard
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; color: #718096; font-size: 14px; line-height: 1.6;">
                If you have any questions or need help getting started, don't hesitate to reach out to our support team.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f7fafc; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0 0 10px; color: #718096; font-size: 14px;">
                Best regards,<br>
                <strong>The Bonifatus Team</strong>
              </p>
              <p style="margin: 20px 0 0; color: #a0aec0; font-size: 12px;">
                Bonifatus - Motivating Academic Excellence<br>
                <a href="https://bonifatus.com" style="color: #667eea; text-decoration: none;">bonifatus.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()

  return { subject, text, html }
}

/**
 * Password reset code template
 */
export function getPasswordResetCodeEmail(
  code: string,
  userName: string,
  expiresInMinutes: number = 15
): { subject: string; text: string; html: string } {
  const subject = 'Reset Your Bonifatus Password'

  const text = `
Hello ${userName},

We received a request to reset your Bonifatus password.

Your password reset code is: ${code}

This code will expire in ${expiresInMinutes} minutes.

If you didn't request a password reset, please ignore this email or contact support if you're concerned about your account security.

Best regards,
The Bonifatus Team

---
Bonifatus - Motivating Academic Excellence
https://bonifatus.com
  `.trim()

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 0; text-align: center;">
        <table role="presentation" style="width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Bonifatus</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 24px; font-weight: 600;">Reset Your Password</h2>

              <p style="margin: 0 0 20px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Hello ${userName},
              </p>

              <p style="margin: 0 0 30px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password. Use the code below to proceed:
              </p>

              <!-- Reset Code Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 30px; background-color: #f7fafc; border-radius: 8px; text-align: center;">
                    <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #667eea; font-family: 'Courier New', monospace;">
                      ${code}
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; color: #718096; font-size: 14px; line-height: 1.6;">
                This code will expire in <strong>${expiresInMinutes} minutes</strong>.
              </p>

              <p style="margin: 20px 0 0; color: #e53e3e; font-size: 14px; line-height: 1.6;">
                <strong>⚠️ Security Notice:</strong> If you didn't request a password reset, please ignore this email or contact our support team if you're concerned about your account security.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f7fafc; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0 0 10px; color: #718096; font-size: 14px;">
                Best regards,<br>
                <strong>The Bonifatus Team</strong>
              </p>
              <p style="margin: 20px 0 0; color: #a0aec0; font-size: 12px;">
                Bonifatus - Motivating Academic Excellence<br>
                <a href="https://bonifatus.com" style="color: #667eea; text-decoration: none;">bonifatus.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()

  return { subject, text, html }
}
