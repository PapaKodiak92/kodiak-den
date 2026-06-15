"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ProfileVisibility = "Public" | "Pack only" | "Private";

type Profile = {
  displayName: string;
  handle: string;
  bio: string;
  bannerStyle: string;
  profileVisibility: ProfileVisibility;
  avatarImage: string | null;
  bannerImage: string | null;
};

type Account = {
  email: string;
  handle: string;
};

type NotificationSettings = {
  comments: boolean;
  reactions: boolean;
  packActivity: boolean;
};

const profileStorageKey = "kodiak-den-local-profile";
const accountStorageKey = "kodiak-den-account";
const sessionStorageKey = "kodiak-den-session";
const roarsStorageKey = "kodiak-den-local-roars";
const packStorageKey = "kodiak-den-pack-members";
const notificationStorageKey = "kodiak-den-notifications";

const defaultProfile: Profile = {
  displayName: "Kodiak",
  handle: "@kodiak",
  bio: "Building Kodiak Den: a private corner of the internet for Roars, Pack, and quiet social connection.",
  bannerStyle: "Pine Ridge",
  profileVisibility: "Public",
  avatarImage: null,
  bannerImage: null,
};

const defaultAccount: Account = {
  email: "",
  handle: "@kodiak",
};

const defaultNotifications: NotificationSettings = {
  comments: true,
  reactions: true,
  packActivity: true,
};

function cleanHandle(value: string) {
  const cleaned = value.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9_@-]/g, "");
  return cleaned ? (cleaned.startsWith("@") ? cleaned : `@${cleaned}`) : "@kodiak";
}

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [account, setAccount] = useState<Account>(defaultAccount);
  const [notifications, setNotifications] = useState<NotificationSettings>(defaultNotifications);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedProfile = window.localStorage.getItem(profileStorageKey);
    const savedAccount = window.localStorage.getItem(accountStorageKey);
    const savedNotifications = window.localStorage.getItem(notificationStorageKey);

    if (savedProfile) setProfile({ ...defaultProfile, ...JSON.parse(savedProfile) });
    if (savedAccount) setAccount({ ...defaultAccount, ...JSON.parse(savedAccount) });
    if (savedNotifications) setNotifications({ ...defaultNotifications, ...JSON.parse(savedNotifications) });
  }, []);

  function saveSettings() {
    const nextProfile = { ...profile, handle: cleanHandle(profile.handle) };
    const nextAccount = { ...account, handle: cleanHandle(account.handle) };

    setProfile(nextProfile);
    setAccount(nextAccount);
    window.localStorage.setItem(profileStorageKey, JSON.stringify(nextProfile));
    window.localStorage.setItem(accountStorageKey, JSON.stringify(nextAccount));
    window.localStorage.setItem(notificationStorageKey, JSON.stringify(notifications));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  function exportAccount() {
    const exportData = {
      profile,
      account,
      notifications,
      roars: JSON.parse(window.localStorage.getItem(roarsStorageKey) ?? "[]"),
      pack: JSON.parse(window.localStorage.getItem(packStorageKey) ?? "[]"),
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "kodiak-den-export.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  function logOut() {
    window.localStorage.removeItem(sessionStorageKey);
    router.push("/sign-in");
  }

  function deleteAccount() {
    if (!window.confirm("Delete your Kodiak Den account from this browser?")) return;

    [profileStorageKey, accountStorageKey, sessionStorageKey, roarsStorageKey, packStorageKey, notificationStorageKey].forEach((key) => window.localStorage.removeItem(key));
    router.push("/");
  }

  return (
    <main className="min-h-screen bg-[#050608] px-6 py-8 text-zinc-100">
      <section className="mx-auto w-full max-w-5xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.35em] text-amber-400">Settings</p>
            <h1 className="mt-3 text-5xl font-black tracking-tight">Account Settings</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
              Manage your profile, account, privacy, notifications, and account data.
            </p>
          </div>
          <Link href="/my-den" className="rounded-full border border-zinc-800 px-5 py-2 text-sm font-bold text-zinc-300 transition hover:border-amber-500 hover:text-amber-300">
            Back to My Den
          </Link>
        </div>

        <div className="mt-8 grid gap-5">
          <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-5">
            <h2 className="text-2xl font-black">Profile</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Display name</span>
                <input value={profile.displayName} onChange={(event) => setProfile((current) => ({ ...current, displayName: event.target.value }))} className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold outline-none focus:border-amber-500" />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Handle</span>
                <input value={profile.handle} onChange={(event) => setProfile((current) => ({ ...current, handle: event.target.value }))} className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold outline-none focus:border-amber-500" />
              </label>
              <label className="space-y-2 sm:col-span-2">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Bio</span>
                <textarea value={profile.bio} onChange={(event) => setProfile((current) => ({ ...current, bio: event.target.value }))} rows={4} className="w-full resize-none rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold outline-none focus:border-amber-500" />
              </label>
            </div>
          </section>

          <section id="privacy" className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-5">
            <h2 className="text-2xl font-black">Privacy and Safety</h2>
            <label className="mt-5 block space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Profile visibility</span>
              <select value={profile.profileVisibility} onChange={(event) => setProfile((current) => ({ ...current, profileVisibility: event.target.value as ProfileVisibility }))} className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold outline-none focus:border-amber-500">
                <option>Public</option>
                <option>Pack only</option>
                <option>Private</option>
              </select>
            </label>
          </section>

          <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-5">
            <h2 className="text-2xl font-black">Notifications</h2>
            <div className="mt-5 grid gap-3">
              {[
                ["comments", "Comments"],
                ["reactions", "Paws Up and Paws Down"],
                ["packActivity", "Pack activity"],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm font-bold">
                  <span>{label}</span>
                  <input type="checkbox" checked={notifications[key as keyof NotificationSettings]} onChange={(event) => setNotifications((current) => ({ ...current, [key]: event.target.checked }))} className="h-5 w-5 accent-amber-500" />
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-5">
            <h2 className="text-2xl font-black">Account</h2>
            <label className="mt-5 block space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Email</span>
              <input type="email" value={account.email} onChange={(event) => setAccount((current) => ({ ...current, email: event.target.value }))} className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold outline-none focus:border-amber-500" />
            </label>
            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={exportAccount} className="rounded-2xl border border-zinc-800 px-5 py-3 text-sm font-black text-zinc-300 transition hover:border-amber-500 hover:text-amber-300">Export Account</button>
              <button onClick={logOut} className="rounded-2xl border border-zinc-800 px-5 py-3 text-sm font-black text-zinc-300 transition hover:border-amber-500 hover:text-amber-300">Log Out</button>
              <button onClick={deleteAccount} className="rounded-2xl border border-red-500/30 px-5 py-3 text-sm font-black text-red-300 transition hover:bg-red-500/10">Delete Account</button>
            </div>
          </section>
        </div>

        <div className="sticky bottom-6 mt-6 flex justify-end">
          <button onClick={saveSettings} className="rounded-2xl bg-amber-500 px-7 py-4 text-sm font-black text-zinc-950 shadow-xl shadow-black/40 transition hover:bg-amber-400">
            {saved ? "Saved" : "Save Settings"}
          </button>
        </div>
      </section>
    </main>
  );
}
