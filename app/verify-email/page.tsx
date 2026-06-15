"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { LocalAccount, readAccount, writeAccount } from "../../lib/localAuth";

type VerifyResponse = {
  account?: LocalAccount;
  error?: string;
};

const pendingVerificationKey = "kodiak-den-pending-verification";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [account, setAccount] = useState<LocalAccount | null>(null);
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const current = readAccount();
    const pendingIdentifier = window.localStorage.getItem(pendingVerificationKey) || current?.email || current?.handle || "";
    setAccount(current);
    setIdentifier(pendingIdentifier);
  }, []);

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("");
    setBusy(true);

    try {
      const currentIdentifier = identifier.trim();
      if (!currentIdentifier) return setError("Enter the email or handle for your Den.");
      if (code.trim().length !== 6) return setError("Enter the six-digit verification code.");

      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: currentIdentifier, code }),
      });
      const result = (await response.json()) as VerifyResponse;

      if (!response.ok || !result.account) {
        setError(result.error || "That verification code does not match.");
        return;
      }

      writeAccount(result.account);
      window.localStorage.removeItem(pendingVerificationKey);
      setStatus("Email verified. Sign in to open your Den.");
      router.push("/sign-in");
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setError("");
    setStatus("");
    setBusy(true);

    try {
      const currentIdentifier = identifier.trim();
      if (!currentIdentifier) return setError("Enter the email or handle for your Den.");

      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: currentIdentifier }),
      });
      const result = (await response.json()) as VerifyResponse;

      if (!response.ok || !result.account) {
        setError(result.error || "Could not send verification email.");
        return;
      }

      setAccount(result.account);
      writeAccount(result.account);
      window.localStorage.setItem(pendingVerificationKey, result.account.email);
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
            Enter the six-digit code sent to {account?.email ?? identifier || "your email"} before opening your Den.
          </p>
          <label className="mt-6 block space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.22em] text-zinc-500">Email or handle</span>
            <input value={identifier} onChange={(event) => setIdentifier(event.target.value)} className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold outline-none focus:border-amber-500" />
          </label>
          <label className="mt-4 block space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.22em] text-zinc-500">Verification code</span>
            <input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold tracking-[0.35em] outline-none focus:border-amber-500" />
          </label>
          {status ? <p className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-300">{status}</p> : null}
          {error ? <p className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">{error}</p> : null}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button disabled={busy} className="rounded-2xl bg-amber-500 px-6 py-4 text-sm font-black text-zinc-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60">
              {busy ? "Checking..." : "Verify Email"}
            </button>
            <button type="button" disabled={busy} onClick={resend} className="rounded-2xl border border-zinc-800 px-6 py-4 text-sm font-black text-zinc-200 transition hover:border-amber-500/40 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-60">
              {busy ? "Sending..." : "Send New Code"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
