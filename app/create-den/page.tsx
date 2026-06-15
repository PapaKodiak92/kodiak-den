"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type ProfileVisibility = "Public" | "Pack only" | "Private";

const profileStorageKey = "kodiak-den-local-profile";
const accountStorageKey = "kodiak-den-account";
const sessionStorageKey = "kodiak-den-session";
const legacyRoarsStorageKey = "kodiak-den-local-roars";

function cleanHandle(value: string) {
  const cleaned = value.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9_@-]/g, "");
  return cleaned ? (cleaned.startsWith("@") ? cleaned : `@${cleaned}`) : "@kodiak";
}

export default function CreateDenPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("Kodiak");
  const [handle, setHandle] = useState("@kodiak");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileVisibility, setProfileVisibility] = useState<ProfileVisibility>("Public");
  const [error, setError] = useState("");

  function createDen(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const name = displayName.trim();
    const cleanedHandle = cleanHandle(handle);
    const accountEmail = email.trim().toLowerCase();

    if (!name) return setError("Add a display name for your Den.");
    if (!accountEmail.includes("@")) return setError("Use a valid email address.");
    if (password.length < 8) return setError("Use at least 8 characters for your password.");
    if (password !== confirmPassword) return setError("Passwords do not match.");

    const profile = {
      displayName: name.slice(0, 40),
      handle: cleanedHandle,
      bio: "Building my Den on Kodiak Den.",
      bannerStyle: "Pine Ridge",
      profileVisibility,
      avatarImage: null,
      bannerImage: null,
    };

    window.localStorage.removeItem(legacyRoarsStorageKey);
    window.localStorage.setItem(`kodiak-den-roars:${cleanedHandle}`, "[]");
    window.localStorage.setItem(`kodiak-den-profile:${cleanedHandle}`, JSON.stringify(profile));
    window.localStorage.setItem(profileStorageKey, JSON.stringify(profile));
    window.localStorage.setItem(accountStorageKey, JSON.stringify({ email: accountEmail, handle: cleanedHandle }));
    window.localStorage.setItem(sessionStorageKey, JSON.stringify({ signedInAt: new Date().toISOString(), handle: cleanedHandle }));

    router.push("/my-den");
  }

  return (
    <main className="min-h-screen bg-[#050608] px-6 py-8 text-zinc-100">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <Link href="/" className="text-sm font-black text-amber-300 transition hover:text-amber-200">
            Kodiak Den
          </Link>
          <h1 className="mt-6 text-5xl font-black tracking-tight sm:text-6xl">Create Your Den.</h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-zinc-400">
            Claim your name, choose your handle, and set the first privacy default for your profile.
          </p>
        </div>

        <form onSubmit={createDen} className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6 shadow-2xl shadow-black/40">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.22em] text-zinc-500">Display name</span>
              <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={40} className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold outline-none focus:border-amber-500" />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.22em] text-zinc-500">Handle</span>
              <input value={handle} onChange={(event) => setHandle(event.target.value)} maxLength={30} className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold outline-none focus:border-amber-500" />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-xs font-black uppercase tracking-[0.22em] text-zinc-500">Email</span>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold outline-none focus:border-amber-500" />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.22em] text-zinc-500">Password</span>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold outline-none focus:border-amber-500" />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.22em] text-zinc-500">Confirm password</span>
              <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold outline-none focus:border-amber-500" />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-xs font-black uppercase tracking-[0.22em] text-zinc-500">Profile visibility</span>
              <select value={profileVisibility} onChange={(event) => setProfileVisibility(event.target.value as ProfileVisibility)} className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold outline-none focus:border-amber-500">
                <option>Public</option>
                <option>Pack only</option>
                <option>Private</option>
              </select>
            </label>
          </div>

          {error ? <p className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">{error}</p> : null}

          <button className="mt-6 w-full rounded-2xl bg-amber-500 px-6 py-4 text-sm font-black text-zinc-950 transition hover:bg-amber-400">
            Create Your Den
          </button>

          <p className="mt-5 text-center text-sm font-bold text-zinc-500">
            Already have a Den? <Link href="/sign-in" className="text-amber-300 hover:text-amber-200">Sign in</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
