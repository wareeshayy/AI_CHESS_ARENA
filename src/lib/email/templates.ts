export interface InviteEmailParams {
  to: string
  roomId: string
  inviteLink: string
  message?: string
  fromName?: string
}

export function buildInviteSubject(): string {
  return "You're invited to play chess on AI Chess Arena"
}

export function buildInviteText({ inviteLink, message, fromName }: InviteEmailParams): string {
  const lines = [
    fromName ? `${fromName} invited you to play chess!` : "You're invited to play chess on AI Chess Arena!",
    "",
    `Join link: ${inviteLink}`,
    "",
    "Click the link to join — no login required. Two players max.",
  ]
  if (message?.trim()) {
    lines.push("", `Message: ${message.trim()}`)
  }
  lines.push("", "See you on the board!")
  return lines.join("\n")
}

export function buildMailtoUrl(params: InviteEmailParams): string {
  const to = params.to.trim()
  const subject = encodeURIComponent(buildInviteSubject())
  const body = encodeURIComponent(buildInviteText(params))
  return `mailto:${to}?subject=${subject}&body=${body}`
}

export function isResendTestingLimitError(message: string): boolean {
  return /testing emails|verify a domain|only send/i.test(message)
}

export function buildInviteHtml({ inviteLink, message, fromName }: InviteEmailParams): string {
  const intro = fromName
    ? `<strong>${escapeHtml(fromName)}</strong> invited you to play chess!`
    : "You're invited to play chess on <strong>AI Chess Arena</strong>!"

  const note = message?.trim()
    ? `<p style="color:#555;font-style:italic;border-left:3px solid #81b64c;padding-left:12px;margin:16px 0;">${escapeHtml(message.trim())}</p>`
    : ""

  return `<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;background:#312e2b;color:#ebebeb;padding:24px;">
  <div style="max-width:480px;margin:0 auto;background:#262421;border-radius:12px;border:1px solid #403d39;padding:28px;">
    <p style="font-size:28px;margin:0 0 8px;">♞</p>
    <h1 style="color:#81b64c;font-size:20px;margin:0 0 16px;">Chess Game Invite</h1>
    <p style="color:#ccc;line-height:1.6;">${intro}</p>
    ${note}
    <a href="${escapeHtml(inviteLink)}" style="display:inline-block;margin:20px 0;padding:14px 28px;background:#81b64c;color:#262421;font-weight:bold;text-decoration:none;border-radius:8px;">Join Game</a>
    <p style="color:#888;font-size:12px;word-break:break-all;">Or copy this link:<br>${escapeHtml(inviteLink)}</p>
  </div>
</body>
</html>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
