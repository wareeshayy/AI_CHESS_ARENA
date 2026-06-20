import "server-only"
import { Resend } from "resend"
import {
  buildInviteHtml,
  buildInviteSubject,
  buildInviteText,
  type InviteEmailParams,
} from "./templates"

function getFromAddress(fromName?: string): string {
  const raw = process.env.EMAIL_FROM ?? "onboarding@resend.dev"
  if (raw.includes("<")) return raw
  const name = fromName ?? process.env.EMAIL_FROM_NAME ?? "AI Chess Arena"
  return `${name} <${raw}>`
}

export async function sendInviteEmail(
  params: InviteEmailParams,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY missing — add it in Vercel env vars" }
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
    return { ok: false, error: error.message }
  }

  if (!data?.id) {
    return { ok: false, error: "Email send returned no confirmation" }
  }

  return { ok: true }
}
