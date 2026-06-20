import "server-only"
import nodemailer from "nodemailer"
import {
  buildInviteHtml,
  buildInviteSubject,
  buildInviteText,
  type InviteEmailParams,
} from "./templates"

function parseFromAddress(): { name: string; email: string } {
  const raw = process.env.EMAIL_FROM ?? "onboarding@resend.dev"
  const match = raw.match(/^(.+?)\s*<([^>]+)>$/)
  if (match) return { name: match[1].trim(), email: match[2].trim() }
  return { name: process.env.EMAIL_FROM_NAME ?? "AI Chess Arena", email: raw }
}

async function sendViaNodemailer(params: InviteEmailParams): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY missing" }

  const from = parseFromAddress()
  const fromName = params.fromName ?? from.name

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.resend.com",
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: true,
    auth: {
      user: process.env.SMTP_USER ?? "resend",
      pass: apiKey,
    },
  })

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${from.email}>`,
      to: params.to.trim(),
      subject: buildInviteSubject(),
      text: buildInviteText({ ...params, fromName }),
      html: buildInviteHtml({ ...params, fromName }),
    })
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

async function sendViaResendApi(params: InviteEmailParams): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY missing" }

  const from = process.env.EMAIL_FROM ?? "AI Chess Arena <onboarding@resend.dev>"
  const fromName = params.fromName ?? process.env.EMAIL_FROM_NAME ?? "AI Chess Arena"

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [params.to.trim()],
      subject: buildInviteSubject(),
      html: buildInviteHtml({ ...params, fromName }),
      text: buildInviteText({ ...params, fromName }),
    }),
  })

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string }
    return { ok: false, error: data.message ?? `Resend API failed (${res.status})` }
  }
  return { ok: true }
}

export async function sendInviteEmail(params: InviteEmailParams): Promise<{ ok: true } | { ok: false; error: string }> {
  const viaSmtp = await sendViaNodemailer(params)
  if (viaSmtp.ok) return viaSmtp
  return sendViaResendApi(params)
}
