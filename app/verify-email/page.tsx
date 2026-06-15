"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { LocalAccount, makeCode, readAccount, setSignedInSession, writeAccount } from "../../lib/localAuth";
import { sendSecurityCodeEmail } from "../../lib/securityEmail";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [account, setAccount] = useState<LocalAccount | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setAccount(readAccount());
  }, []);

  function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("");

    const current = readAccount();
    if (!current?.handle || !current?.email) return setError("Create your Den first.");
    if (!current.verificationCode || current.verificationCode !== code.trim()) return setError("That verification code does not match.");
    if (current.verificationExpiresAt && Date.now() > new Date(current.verificationExpiresAt).getTime()) return setError("That verification code expired. Send a new code.");

    const verified = { ...current, emailVerified: true, verificationCode: undefined, verificationExpiresAt: undefined };
    writeAccount(verified);
    setSignedInSession(verified);
    router.push("/my-den");
  }

  async function resend() {
    setError("");
    setStatus("");
    setBusy(true);

    try {
      const current = readAccount();
      if (!current?.email) return setError("Create your Den first.");

      const nextCode = makeCode();
      const updated = {
        ...current,
        emailVerified: false,
        verificationCode: nextCode,
        verificationExpiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
      };

      writeAccount(updated);
      setAccount(updated);

      const emailResult = await sendSecurityCodeEmail({
        email: updated.email,
        code: nextCode,
        kind: "verify",
      });

      if (!emailResult.ok) {
        setError(emailResult.error || "Could not send verification email.");
        return;
      }

      setStatus("A new verification code has been sent.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050608] px-6 py-8 text-zinc-100">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-4xl items-center">
        <form onSubmit={verify} className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6 shadow-2xl shadow-black/40">
          <Link href="/" className="text-sm font-black text-amber-300 transition hover:text-amber-200">Kodiak Den</Link>
          <h1 className="mt-6 text-4xl font-black tracking-tight">Verify your email.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400">
            Enter the six-digit code sent to {account?.email ?? "your email"} before opening your Den.
          </p>
          <label className="mt-6 block space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.22em] text-zinc-500">Verification code</span>
            <input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold tracking-[0.35em] outline-none focus:border-amber-500" />
          </label>
          {status ? <p className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-300">{status}</p> : null}
          {error ? <p className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">{error}</p> : null}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button className="rounded-2xl bg-amber-500 px-6 py-4 text-sm font-black text-zinc-950 transition hover:bg-amber-400">Verify Email</button>
            <button type="button" disabled={busy} onClick={resend} className="rounded-2xl border border-zinc-800 px-6 py-4 text-sm font-black text-zinc-200 transition hover:border-amber-500/40 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-60">
              {busy ? "Sending..." : "Send New Code"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
