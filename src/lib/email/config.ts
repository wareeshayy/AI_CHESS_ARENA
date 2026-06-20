export function isEmailProviderConfigured(): boolean {
  const hasGmail =
    !!(process.env.GMAIL_USER || process.env.SMTP_USER) &&
    !!(process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS)
  const hasResend = !!process.env.RESEND_API_KEY
  return hasGmail || hasResend
}

export function getEmailSetupHint(): string {
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return "Gmail SMTP"
  }
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    return "SMTP"
  }
  if (process.env.RESEND_API_KEY) {
    return "Resend (verify a domain on resend.com to email anyone, or add GMAIL_USER + GMAIL_APP_PASSWORD on Vercel)"
  }
  return "Add GMAIL_USER + GMAIL_APP_PASSWORD or RESEND_API_KEY in Vercel environment variables."
}
