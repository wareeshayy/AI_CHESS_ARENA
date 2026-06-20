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
  | { ok: true }
  | { ok: false; error: string; fallback?: "mailto"; mailtoUrl?: string }

function getFromAddress(fromName?: string): string {
  const raw = process.env.EMAIL_FROM ?? "onboarding@resend.dev"
  if (raw.includes("<")) return raw
  const name = fromName ?? process.env.EMAIL_FROM_NAME ?? "AI Chess Arena"
  return `${name} <${raw}>`
}

export async function sendInviteEmail(params: InviteEmailParams): Promise<SendInviteResult> {
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
    if (isResendTestingLimitError(error.message)) {
      return {
        ok: false,
        error:
          "Resend test mode: verify a domain at resend.com/domains to auto-send to anyone. Use your email app or copy the link instead.",
        fallback: "mailto",
        mailtoUrl: buildMailtoUrl({ ...params, fromName }),
      }
    }
    return { ok: false, error: error.message }
  }

  if (!data?.id) {
    return { ok: false, error: "Email send returned no confirmation" }
  }

  return { ok: true }
}
