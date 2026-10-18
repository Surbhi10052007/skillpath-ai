/**
 * Transactional email via Resend (https://resend.com/docs/api-reference/emails/send-email).
 *
 * Uses the REST API directly over fetch so the app needs no extra SDK and the
 * endpoint can be pointed at a local stub during testing.
 */
const RESEND_ENDPOINT =
  process.env.RESEND_API_URL?.trim() || "https://api.resend.com/emails";

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_FROM?.trim());
}

/** Absolute base URL for links in emails. Never hardcode localhost. */
export function resolveAppUrl(requestOrigin?: string) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const base = configured || requestOrigin || "";
  return base.replace(/\/+$/, "");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface ResetEmailArgs {
  to: string;
  name: string;
  resetUrl: string;
  expiresInMinutes: number;
}

function buildEmail({ name, resetUrl, expiresInMinutes }: Omit<ResetEmailArgs, "to">) {
  const safeName = escapeHtml(name || "there");
  const safeUrl = escapeHtml(resetUrl);

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#090a08;color:#f4f0e6;font-family:'Helvetica Neue',Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Reset your SkillPath password — the link expires in ${expiresInMinutes} minutes.</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#090a08;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;border:1px solid #262a20;background:#10120e;">
            <tr>
              <td style="padding:28px 32px;border-bottom:1px solid #262a20;">
                <span style="font-size:20px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#f4f0e6;">Skill<span style="color:#d6ff3c;">Path</span></span>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 8px;">
                <p style="margin:0 0 10px;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#d6ff3c;">Password reset</p>
                <h1 style="margin:0;font-size:30px;line-height:1.15;font-weight:700;color:#f4f0e6;">Reset your SkillPath password</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 0;font-size:15px;line-height:1.65;color:#b9b5a8;">
                <p style="margin:0 0 16px;">Hi ${safeName},</p>
                <p style="margin:0 0 16px;">We received a request to reset the password for the SkillPath account linked to this email address. Choose a new password using the button below.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 32px 24px;">
                <a href="${safeUrl}" style="display:inline-block;background:#d6ff3c;color:#090a08;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;padding:15px 26px;">Reset password</a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 24px;font-size:13px;line-height:1.6;color:#b9b5a8;">
                <p style="margin:0 0 8px;">This link expires in ${expiresInMinutes} minutes and can be used once.</p>
                <p style="margin:0 0 16px;">If the button doesn't work, copy this link into your browser:</p>
                <p style="margin:0;word-break:break-all;font-family:'Courier New',monospace;font-size:12px;color:#d6ff3c;">${safeUrl}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 32px;border-top:1px solid #262a20;font-size:12px;line-height:1.6;color:#7c7a70;">
                <p style="margin:0 0 8px;"><strong style="color:#b9b5a8;">Didn't request this?</strong> You can safely ignore this email — your password will stay the same.</p>
                <p style="margin:0;">SkillPath will never ask you for your password by email.</p>
              </td>
            </tr>
          </table>
          <p style="max-width:560px;margin:18px auto 0;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#57564e;text-align:center;">SkillPath · Your skills. Your path. Your future.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    "Reset your SkillPath password",
    "",
    `Hi ${name || "there"},`,
    "",
    "We received a request to reset the password for the SkillPath account linked to this email address.",
    "",
    `Reset your password: ${resetUrl}`,
    "",
    `This link expires in ${expiresInMinutes} minutes and can be used once.`,
    "",
    "Didn't request this? You can safely ignore this email — your password will stay the same.",
    "SkillPath will never ask you for your password by email.",
  ].join("\n");

  return {
    subject: "Reset your SkillPath password",
    html,
    text,
  };
}

/**
 * Sends the reset email. Throws on failure so the caller can decide what to
 * tell the user. The raw token is only ever inside `resetUrl` — never logged.
 */
export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
  expiresInMinutes,
}: ResetEmailArgs) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !from) throw new Error("Email provider is not configured (RESEND_API_KEY / EMAIL_FROM).");

  const { subject, html, text } = buildEmail({ name, resetUrl, expiresInMinutes });

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, html, text }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    // Never include the reset URL/token in error output.
    throw new Error(`Resend rejected the email (${response.status}): ${detail.slice(0, 300)}`);
  }

  const data = (await response.json().catch(() => ({}))) as { id?: string };
  return { id: data.id ?? null };
}
