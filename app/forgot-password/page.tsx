"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type ForgotPasswordResponse = {
  error?: string;
};

const pendingResetKey = "kodiak-den-pending-reset";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function requestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSent(false);
    setBusy(true);

    try {
      const value = identifier.trim();
      if (!value) return setError("Enter your email or handle.");

      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: value }),
      });
      const result = (await response.json()) as ForgotPasswordResponse;

      if (!response.ok) {
        setError(result.error || "Could not send reset email.");
        return;
      }

      window.localStorage.setItem(pendingResetKey, value);
      setSent(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050608] px-6 py-8 text-zinc-100">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-4xl items-center">
        <form onSubmit={requestReset} className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6 shadow-2xl shadow-black/40">
          <Link href="/sign-in" className="text-sm font-black text-amber-300 transition hover:text-amber-200">Back to Sign In</Link>
          <h1 className="mt-6 text-4xl font-black tracking-tight">Reset access to your Den.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400">
            Enter your email or handle. If that Den exists, we will send a reset code.
          </p>
          <label className="mt-6 block space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.22em] text-zinc-500">Email or handle</span>
            <input value={identifier} onChange={(event) => setIdentifier(event.target.value)} className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold outline-none focus:border-amber-500" />
          </label>
          {sent ? (
            <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-300">
              If that Den exists, a reset code has been sent. <Link href="/reset-password" className="text-emerald-200 underline">Enter code</Link>
            </div>
          ) : null}
          {error ? <p className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">{error}</p> : null}
          <button disabled={busy} className="mt-6 w-full rounded-2xl bg-amber-500 px-6 py-4 text-sm font-black text-zinc-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60">
            {busy ? "Sending..." : "Send Reset Code"}
          </button>
        </form>
      </section>
    </main>
  );
}
