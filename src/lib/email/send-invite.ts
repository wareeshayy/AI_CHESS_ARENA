import "server-only"
import { Resend } from "resend"
import {
  buildInviteHtml,
  buildInviteSubject,
  buildInviteText,
  buildMailtoUrl,
  isResendTestingLimitError,
  type InviteEmailParams,
} from "./templates"

export type SendInviteResult =
  | { ok: true; provider?: "gmail" | "resend" }
  | { ok: false; error: string; fallback?: "mailto"; mailtoUrl?: string }

function getFromAddress(fromName?: string): string {
  const raw = process.env.EMAIL_FROM ?? process.env.SMTP_USER ?? process.env.GMAIL_USER ?? "onboarding@resend.dev"
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
        error: "Auto-send unavailable for this address. Use Email app or Copy link instead.",
        fallback: "mailto",
        mailtoUrl: buildMailtoUrl({ ...params, fromName }),
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
  const fromName = params.fromName ?? process.env.EMAIL_FROM_NAME ?? "AI Chess Arena"
  const mailtoFallback = (): SendInviteResult => ({
    ok: false,
    error: "Auto-send unavailable — use Email app or Copy link (both free, no setup).",
    fallback: "mailto",
    mailtoUrl: buildMailtoUrl({ ...params, fromName }),
  })

  const hasGmail = !!(process.env.SMTP_USER ?? process.env.GMAIL_USER)
  const hasResend = !!process.env.RESEND_API_KEY

  if (hasGmail) {
    try {
      const result = await sendViaGmail(params)
      if (result.ok) return result
    } catch (err) {
      console.warn("Gmail SMTP send failed:", err)
    }
  }

  if (hasResend) {
    const result = await sendViaResend(params)
    if (result.ok) return result
    if (result.fallback === "mailto") return result
    if (hasGmail) return result
  }

  if (!hasGmail && !hasResend) {
    return mailtoFallback()
  }

  return mailtoFallback()
}
