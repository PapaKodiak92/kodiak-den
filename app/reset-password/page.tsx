"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { clearSignedInSession, createCredential, readAccount, writeAccount } from "../../lib/localAuth";

export default function ResetPasswordPage() {
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  async function reset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSuccess(false);
    setBusy(true);

    try {
      const account = readAccount();
      if (!account) return setMessage("No account was found on this device.");
      if (code.trim().length !== 6) return setMessage("Enter the six-digit reset code.");
      if (!account.resetCode || account.resetCode !== code.trim()) return setMessage("That reset code does not match.");
      if (account.resetExpiresAt && Date.now() > new Date(account.resetExpiresAt).getTime()) return setMessage("That reset code expired. Request a new one.");
      if (newPassword.length < 6) return setMessage("Use at least 6 characters.");
      if (newPassword !== confirmPassword) return setMessage("Passwords do not match.");

      const { credentialHash, credentialSalt } = await createCredential(newPassword);
      writeAccount({
        ...account,
        credentialHash,
        credentialSalt,
        resetCode: undefined,
        resetExpiresAt: undefined,
        failedSignInAttempts: 0,
        lockedUntil: undefined,
      });
      clearSignedInSession();
      setSuccess(true);
      setMessage("Your password has been reset. You can sign in now.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050608] px-6 py-8 text-zinc-100">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-4xl items-center">
        <form onSubmit={reset} className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6 shadow-2xl shadow-black/40">
          <Link href="/sign-in" className="text-sm font-black text-amber-300 transition hover:text-amber-200">Back to Sign In</Link>
          <h1 className="mt-6 text-4xl font-black tracking-tight">Choose a new password.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400">Enter the reset code and choose a new password for your account.</p>
          <label className="mt-6 block space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.22em] text-zinc-500">Reset code</span>
            <input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold tracking-[0.35em] outline-none focus:border-amber-500" />
          </label>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.22em] text-zinc-500">New password</span>
              <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold outline-none focus:border-amber-500" />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.22em] text-zinc-500">Confirm password</span>
              <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold outline-none focus:border-amber-500" />
            </label>
          </div>
          <p className="mt-4 text-xs leading-5 text-zinc-500">Password must be at least 6 characters.</p>
          {message ? <p className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-bold ${success ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-red-500/30 bg-red-500/10 text-red-300"}`}>{message}</p> : null}
          <button disabled={busy} className="mt-6 w-full rounded-2xl bg-amber-500 px-6 py-4 text-sm font-black text-zinc-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60">{busy ? "Resetting..." : "Reset Password"}</button>
          {success ? <Link href="/sign-in" className="mt-4 block text-center text-sm font-black text-amber-300 transition hover:text-amber-200">Sign in</Link> : null}
        </form>
      </section>
    </main>
  );
}
