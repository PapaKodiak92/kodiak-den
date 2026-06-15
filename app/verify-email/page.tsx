"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

const accountStorageKey = "kodiak-den-account";
const sessionStorageKey = "kodiak-den-session";
const inboxKey = "kodiak-den-security-inbox";

function readAccount() {
  try {
    const saved = window.localStorage.getItem(accountStorageKey);
    return saved ? (JSON.parse(saved) as { email?: string; handle?: string; emailVerified?: boolean; verificationCode?: string; verificationExpiresAt?: string }) : null;
  } catch {
    return null;
  }
}

function readCode() {
  try {
    const saved = window.sessionStorage.getItem(inboxKey);
    return saved ? (JSON.parse(saved) as { kind?: string; code?: string; email?: string }) : null;
  } catch {
    return null;
  }
}

export default function VerifyEmailPage() {
  const router = useRouter();
  const account = useMemo(() => (typeof window === "undefined" ? null : readAccount()), []);
  const inbox = useMemo(() => (typeof window === "undefined" ? null : readCode()), []);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const current = readAccount();
    if (!current?.handle || !current?.email) return setError("Create your Den first.");
    if (!current.verificationCode || current.verificationCode !== code.trim()) return setError("That verification code does not match.");
    if (current.verificationExpiresAt && Date.now() > new Date(current.verificationExpiresAt).getTime()) return setError("That verification code expired. Send a new code.");

    const verified = { ...current, emailVerified: true, verificationCode: undefined, verificationExpiresAt: undefined };
    window.localStorage.setItem(accountStorageKey, JSON.stringify(verified));
    window.localStorage.setItem(sessionStorageKey, JSON.stringify({ signedInAt: new Date().toISOString(), handle: current.handle }));
    window.sessionStorage.removeItem(inboxKey);
    router.push("/my-den");
  }

  function resend() {
    const current = readAccount();
    if (!current?.email) return setError("Create your Den first.");
    const nextCode = String(Math.floor(100000 + Math.random() * 900000));
    const updated = { ...current, verificationCode: nextCode, verificationExpiresAt: new Date(Date.now() + 15 * 60_000).toISOString() };
    window.localStorage.setItem(accountStorageKey, JSON.stringify(updated));
    window.sessionStorage.setItem(inboxKey, JSON.stringify({ kind: "verify", code: nextCode, email: current.email }));
    setError("");
    window.location.reload();
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
          {inbox?.kind === "verify" && inbox.code ? (
            <div className="mt-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-black text-amber-200">
              Verification code: {inbox.code}
            </div>
          ) : null}
          <label className="mt-6 block space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.22em] text-zinc-500">Verification code</span>
            <input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold tracking-[0.35em] outline-none focus:border-amber-500" />
          </label>
          {error ? <p className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">{error}</p> : null}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button className="rounded-2xl bg-amber-500 px-6 py-4 text-sm font-black text-zinc-950 transition hover:bg-amber-400">Verify Email</button>
            <button type="button" onClick={resend} className="rounded-2xl border border-zinc-800 px-6 py-4 text-sm font-black text-zinc-200 transition hover:border-amber-500/40 hover:text-amber-300">Send New Code</button>
          </div>
        </form>
      </section>
    </main>
  );
}
