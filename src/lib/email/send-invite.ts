import "server-only"
import { Resend } from "resend"
import {
  buildInviteHtml,
  buildInviteSubject,
  buildInviteText,
  isResendTestingLimitError,
  type InviteEmailParams,
} from "./templates"

export type SendInviteResult =
  | { ok: true; provider: "gmail" | "resend" | "resend-smtp" }
  | { ok: false; error: string }

function getFromAddress(fromName?: string): string {
  const raw =
    process.env.EMAIL_FROM ??
    process.env.SMTP_USER ??
    process.env.GMAIL_USER ??
    "onboarding@resend.dev"
  if (raw.includes("<")) return raw
  const name = fromName ?? process.env.EMAIL_FROM_NAME ?? "AI Chess Arena"
  return `${name} <${raw}>`
}

async function sendViaGmail(params: InviteEmailParams): Promise<SendInviteResult> {
  const user = process.env.SMTP_USER ?? process.env.GMAIL_USER
  const pass = process.env.SMTP_PASS ?? process.env.GMAIL_APP_PASSWORD
  if (!user || !pass) {
    return { ok: false, error: "Gmail SMTP not configured" }
  }

  const nodemailer = await import("nodemailer")
  const fromName = params.fromName ?? process.env.EMAIL_FROM_NAME ?? "AI Chess Arena"

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: process.env.SMTP_SECURE !== "false",
    auth: { user, pass },
  })

  await transporter.sendMail({
    from: getFromAddress(fromName),
    to: params.to.trim(),
    subject: buildInviteSubject(),
    html: buildInviteHtml({ ...params, fromName }),
    text: buildInviteText({ ...params, fromName }),
  })

  return { ok: true, provider: "gmail" }
}

async function sendViaResendSmtp(params: InviteEmailParams): Promise<SendInviteResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY missing" }
  }

  const nodemailer = await import("nodemailer")
  const fromName = params.fromName ?? process.env.EMAIL_FROM_NAME ?? "AI Chess Arena"

  const transporter = nodemailer.createTransport({
    host: "smtp.resend.com",
    port: Number(process.env.RESEND_SMTP_PORT ?? 465),
    secure: true,
    auth: { user: "resend", pass: apiKey },
  })

  await transporter.sendMail({
    from: getFromAddress(fromName),
    to: params.to.trim(),
    subject: buildInviteSubject(),
    html: buildInviteHtml({ ...params, fromName }),
    text: buildInviteText({ ...params, fromName }),
  })

  return { ok: true, provider: "resend-smtp" }
}

async function sendViaResend(params: InviteEmailParams): Promise<SendInviteResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY missing" }
  }

  const fromName = params.fromName ?? process.env.EMAIL_FROM_NAME ?? "AI Chess Arena"
  const resend = new Resend(apiKey)

  const { data, error } = await resend.emails.send({
    from: getFromAddress(fromName),
    to: params.to.trim(),
    subject: buildInviteSubject(),
    html: buildInviteHtml({ ...params, fromName }),
    text: buildInviteText({ ...params, fromName }),
  })

  if (error) {
    if (isResendTestingLimitError(error.message)) {
      return {
        ok: false,
        error:
          "Resend test mode only emails your account address. Add GMAIL_USER and GMAIL_APP_PASSWORD on Vercel to auto-send invites to anyone.",
      }
    }
    return { ok: false, error: error.message }
  }

  if (!data?.id) {
    return { ok: false, error: "Email send returned no confirmation" }
  }

  return { ok: true, provider: "resend" }
}

export async function sendInviteEmail(params: InviteEmailParams): Promise<SendInviteResult> {
  const hasGmail = !!(process.env.SMTP_USER ?? process.env.GMAIL_USER)
  const hasGmailPass = !!(process.env.SMTP_PASS ?? process.env.GMAIL_APP_PASSWORD)
  const hasResend = !!process.env.RESEND_API_KEY

  if (hasGmail && hasGmailPass) {
    try {
      const result = await sendViaGmail(params)
      if (result.ok) return result
    } catch (err) {
      console.warn("Gmail SMTP send failed:", err)
    }
  }

  if (hasResend) {
    const sdkResult = await sendViaResend(params)
    if (sdkResult.ok) return sdkResult

    if (!isResendTestingLimitError(sdkResult.error)) {
      return sdkResult
    }

    try {
      const smtpResult = await sendViaResendSmtp(params)
      if (smtpResult.ok) return smtpResult
    } catch (err) {
      console.warn("Resend SMTP send failed:", err)
    }

    if (hasGmail && hasGmailPass) {
      return {
        ok: false,
        error: "Could not send invite. Check Gmail app password on Vercel.",
      }
    }

    return sdkResult
  }

  if (hasGmail && !hasGmailPass) {
    return { ok: false, error: "GMAIL_APP_PASSWORD is missing on the server." }
  }

  return {
    ok: false,
    error:
      "Email not configured. Add GMAIL_USER + GMAIL_APP_PASSWORD (recommended) or RESEND_API_KEY on Vercel.",
  }
}
