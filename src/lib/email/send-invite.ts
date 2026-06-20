import "server-only"
import {
  buildInviteHtml,
  buildInviteSubject,
  buildInviteText,
  type InviteEmailParams,
} from "./templates"

export type SendInviteResult =
  | { ok: true; provider: "gmail" }
  | { ok: false; error: string }

async function sendViaGmail(params: InviteEmailParams): Promise<SendInviteResult> {
  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD
  if (!user || !pass) {
    return { ok: false, error: "Gmail is not configured. Add GMAIL_USER and GMAIL_APP_PASSWORD on Vercel." }
  }

  const nodemailer = await import("nodemailer")
  const fromName = params.fromName ?? process.env.EMAIL_FROM_NAME ?? "AI Chess Arena"

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  })

  await transporter.sendMail({
    from: `${fromName} <${user}>`,
    to: params.to.trim(),
    subject: buildInviteSubject(),
    text: buildInviteText({ ...params, fromName }),
    html: buildInviteHtml({ ...params, fromName }),
  })

  return { ok: true, provider: "gmail" }
}

export async function sendInviteEmail(params: InviteEmailParams): Promise<SendInviteResult> {
  try {
    return await sendViaGmail(params)
  } catch (err) {
    console.error("Gmail invite send failed:", err)
    return {
      ok: false,
      error: "Could not send invite email. Check GMAIL_USER and GMAIL_APP_PASSWORD on Vercel.",
    }
  }
}
