export type SecurityEmailKind = "verify" | "reset";

export async function sendSecurityCodeEmail({
  email,
  code,
  kind,
}: {
  email: string;
  code: string;
  kind: SecurityEmailKind;
}) {
  try {
    const response = await fetch("/api/security/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code, kind }),
    });

    const body = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        ok: false,
        error: body?.error || "Could not send email.",
      };
    }

    return { ok: true, error: "" };
  } catch {
    return { ok: false, error: "Could not reach email delivery." };
  }
}
