export function isEmailProviderConfigured(): boolean {
  return !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)
}

export function getEmailSetupHint(): string {
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return "Gmail SMTP"
  }
  return "Add GMAIL_USER + GMAIL_APP_PASSWORD in Vercel environment variables."
}
