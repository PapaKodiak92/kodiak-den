"use client";

import Image from "next/image";
import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import kodiakDenLogo from "../../assets/kodiak-den-logo.png";

type Visibility = "Public" | "Pack" | "Inner Den";
type ProfileVisibility = "Public" | "Pack only" | "Private";
type BannerStyle = "Kodiak Gold" | "Midnight Den" | "Pine Ridge";
type RoarComment = { id: string; author: string; handle: string; time: string; text: string };
type Roar = {
  id: string;
  time: string;
  editedAt?: string;
  visibility: Visibility;
  text: string;
  pawsUp: number;
  pawsDown: number;
  comments: RoarComment[];
};
type Profile = {
  displayName: string;
  handle: string;
  bio: string;
  bannerStyle: BannerStyle;
  profileVisibility: ProfileVisibility;
  avatarImage: string | null;
  bannerImage: string | null;
};

const roarsStorageKey = "kodiak-den-local-roars";
const profileStorageKey = "kodiak-den-local-profile";
const maxImageBytes = 2.5 * 1024 * 1024;

const defaultProfile: Profile = {
  displayName: "Kodiak",
  handle: "@kodiak",
  bio: "Building Kodiak Den: a private corner of the internet for Roars, Pack, and quiet social connection.",
  bannerStyle: "Pine Ridge",
  profileVisibility: "Public",
  avatarImage: null,
  bannerImage: null,
};

const bannerStyles: Record<BannerStyle, string> = {
  "Kodiak Gold": "bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.36),_transparent_34%),linear-gradient(135deg,_rgba(245,158,11,0.22),_rgba(24,24,27,0.45),_rgba(5,6,8,1))]",
  "Midnight Den": "bg-[radial-gradient(circle_at_top_left,_rgba(113,113,122,0.28),_transparent_34%),linear-gradient(135deg,_rgba(39,39,42,0.92),_rgba(9,9,11,1),_rgba(5,6,8,1))]",
  "Pine Ridge": "bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.18),_transparent_34%),linear-gradient(135deg,_rgba(20,83,45,0.55),_rgba(24,24,27,0.55),_rgba(5,6,8,1))]",
};

function KodiakBrand() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <div className="relative h-14 w-14 overflow-hidden rounded-2xl">
        <Image src={kodiakDenLogo} alt="" priority className="h-full w-full origin-top scale-[2.25] object-contain object-top" />
      </div>
      <div className="leading-none">
        <div className="flex gap-2 text-2xl font-black">
          <span>Kodiak</span>
          <span className="text-amber-400">Den</span>
        </div>
        <div className="mt-2 flex items-center gap-2 text-[0.6rem] font-bold uppercase tracking-[0.32em] text-zinc-400">
          <span className="h-px w-6 bg-amber-500" />
          <span>Privacy-first social</span>
          <span className="h-px w-6 bg-amber-500" />
        </div>
      </div>
    </Link>
  );
}

function Avatar({ profile, size = "md" }: { profile: Profile; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-12 w-12 rounded-2xl text-sm",
    md: "h-16 w-16 rounded-3xl text-base",
    lg: "h-28 w-28 rounded-[2rem] text-2xl",
  }[size];

  return (
    <div className={`grid shrink-0 place-items-center overflow-hidden border border-amber-500/30 bg-amber-500/10 font-black text-amber-300 ring-4 ring-[#050608] ${sizeClasses}`}>
      {profile.avatarImage ? <img src={profile.avatarImage} alt="Profile picture" className="h-full w-full object-cover" /> : <span>KD</span>}
    </div>
  );
}

function cleanHandle(value: string) {
  const cleaned = value.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9_@-]/g, "");
  return cleaned ? (cleaned.startsWith("@") ? cleaned : `@${cleaned}`) : "@kodiak";
}

function normalizeImage(value: unknown) {
  return typeof value === "string" && value.startsWith("data:image/") ? value : null;
}

function normalizeProfile(raw: unknown): Profile {
  if (!raw || typeof raw !== "object") return defaultProfile;
  const value = raw as Partial<Profile>;

  return {
    displayName: typeof value.displayName === "string" && value.displayName.trim() ? value.displayName.trim().slice(0, 40) : defaultProfile.displayName,
    handle: typeof value.handle === "string" ? cleanHandle(value.handle) : defaultProfile.handle,
    bio: typeof value.bio === "string" && value.bio.trim() ? value.bio.trim().slice(0, 180) : defaultProfile.bio,
    bannerStyle: typeof value.bannerStyle === "string" && value.bannerStyle in bannerStyles ? (value.bannerStyle as BannerStyle) : defaultProfile.bannerStyle,
    profileVisibility: value.profileVisibility === "Pack only" || value.profileVisibility === "Private" || value.profileVisibility === "Public" ? value.profileVisibility : defaultProfile.profileVisibility,
    avatarImage: normalizeImage(value.avatarImage),
    bannerImage: normalizeImage(value.bannerImage),
  };
}

function normalizeRoars(raw: unknown): Roar[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const roar = item as Partial<Roar> & { pawprints?: number };
      return {
        id: roar.id ?? crypto.randomUUID(),
        time: roar.time ?? "now",
        editedAt: typeof roar.editedAt === "string" ? roar.editedAt : undefined,
        visibility: roar.visibility ?? "Public",
        text: roar.text ?? "",
        pawsUp: roar.pawsUp ?? roar.pawprints ?? 0,
        pawsDown: roar.pawsDown ?? 0,
        comments: Array.isArray(roar.comments) ? (roar.comments as RoarComment[]) : [],
      };
    })
    .filter((roar) => roar.text.trim().length > 0);
}

function readImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => (typeof reader.result === "string" ? resolve(reader.result) : reject());
    reader.onerror = () => reject();
    reader.readAsDataURL(file);
  });
}

export default function MyDenPage() {
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [draftProfile, setDraftProfile] = useState<Profile>(defaultProfile);
  const [roars, setRoars] = useState<Roar[]>([]);
  const [editingProfile, setEditingProfile] = useState(false);

  useEffect(() => {
    const savedProfile = window.localStorage.getItem(profileStorageKey);
    const savedRoars = window.localStorage.getItem(roarsStorageKey);

    if (savedProfile) {
      const next = normalizeProfile(JSON.parse(savedProfile));
      setProfile(next);
      setDraftProfile(next);
    }

    if (savedRoars) setRoars(normalizeRoars(JSON.parse(savedRoars)));
  }, []);

  const stats = useMemo(
    () => ({
      roars: roars.length,
      pawsUp: roars.reduce((sum, roar) => sum + roar.pawsUp, 0),
      pawsDown: roars.reduce((sum, roar) => sum + roar.pawsDown, 0),
      comments: roars.reduce((sum, roar) => sum + roar.comments.length, 0),
    }),
    [roars],
  );

  const bannerStyle = profile.bannerImage
    ? { backgroundImage: `linear-gradient(135deg, rgba(5,6,8,0.10), rgba(5,6,8,0.62)), url(${profile.bannerImage})` }
    : undefined;

  function saveProfile() {
    const next = normalizeProfile({ ...draftProfile, handle: cleanHandle(draftProfile.handle) });
    setProfile(next);
    setDraftProfile(next);
    window.localStorage.setItem(profileStorageKey, JSON.stringify(next));
    setEditingProfile(false);
  }

  async function uploadImage(field: "avatarImage" | "bannerImage", event: ChangeEvent<HTMLInputElement>, target: "draft" | "profile" = "draft") {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;
    if (!file.type.startsWith("image/")) return window.alert("Choose an image file for your Den.");
    if (file.size > maxImageBytes) return window.alert("That image is too large. Choose an image under 2.5 MB.");

    try {
      const image = await readImage(file);

      if (target === "profile") {
        const next = normalizeProfile({ ...profile, [field]: image });
        setProfile(next);
        setDraftProfile(next);
        window.localStorage.setItem(profileStorageKey, JSON.stringify(next));
        return;
      }

      setDraftProfile((current) => ({ ...current, [field]: image }));
    } catch {
      window.alert("Could not read that image. Try another one.");
    }
  }

  const mainNav = [
    ["The Trail", "/den"],
    ["My Den", "/my-den"],
    ["Pack", "/pack"],
  ];

  return (
    <main className="min-h-screen bg-[#050608] text-zinc-100">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[240px_1fr_320px]">
        <aside className="hidden lg:block">
          <div className="sticky top-6 space-y-6">
            <KodiakBrand />
            <nav className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-3">
              {mainNav.map(([label, href]) => (
                <Link
                  key={label}
                  href={href}
                  className={
                    label === "My Den"
                      ? "block rounded-2xl bg-amber-500/10 px-4 py-3 text-sm font-black text-amber-300 ring-1 ring-amber-500/20"
                      : "block rounded-2xl px-4 py-3 text-sm font-bold text-zinc-300 transition hover:bg-zinc-900 hover:text-amber-300"
                  }
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        <section className="space-y-5">
          <header className="overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/30">
            <label className="group relative block h-60 cursor-pointer overflow-hidden">
              <div className={`absolute inset-0 bg-cover bg-center ${profile.bannerImage ? "" : bannerStyles[profile.bannerStyle]}`} style={bannerStyle} />
              <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/25" />
              <div className="absolute right-5 top-5 rounded-full border border-zinc-700/70 bg-zinc-950/80 px-4 py-2 text-xs font-black opacity-0 backdrop-blur transition group-hover:opacity-100">
                Edit banner
              </div>
              <input type="file" accept="image/*" onChange={(event) => uploadImage("bannerImage", event, "profile")} className="hidden" />
            </label>

            <div className="px-6 pb-8 sm:px-8 sm:pb-9">
              <div className="-mt-8 flex flex-col justify-between gap-7 sm:flex-row sm:items-end">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:gap-5">
                  <label className="group relative block cursor-pointer">
                    <Avatar profile={profile} size="lg" />
                    <div className="absolute inset-0 grid place-items-center rounded-[2rem] bg-black/0 text-xs font-black opacity-0 transition group-hover:bg-black/45 group-hover:opacity-100">
                      Edit
                    </div>
                    <input type="file" accept="image/*" onChange={(event) => uploadImage("avatarImage", event, "profile")} className="hidden" />
                  </label>

                  <div className="pb-2 sm:pb-4">
                    <p className="text-4xl font-black tracking-tight">{profile.displayName}</p>
                    <p className="mt-1 text-sm font-bold text-zinc-500">{profile.handle}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setDraftProfile(profile);
                    setEditingProfile(true);
                  }}
                  className="w-fit rounded-full border border-zinc-800 px-5 py-2 text-sm font-bold text-zinc-300 transition hover:border-amber-500 hover:text-amber-300"
                >
                  Edit Profile
                </button>
              </div>

              <p className="mt-8 max-w-2xl whitespace-pre-wrap text-sm leading-6 text-zinc-400">{profile.bio}</p>

              <div className="mt-6 grid gap-3 sm:grid-cols-4">
                {[
                  [stats.roars, "Roars", "text-amber-300"],
                  [stats.pawsUp, "Paws Up", "text-amber-300"],
                  [stats.pawsDown, "Paws Down", "text-red-300"],
                  [stats.comments, "Comments", "text-amber-300"],
                ].map(([value, label, color]) => (
                  <div key={label} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                    <p className={`text-2xl font-black ${color}`}>{value}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </header>

          {editingProfile && (
            <section className="rounded-[2rem] border border-amber-500/20 bg-amber-500/10 p-5">
              <div className="flex justify-between gap-3">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.3em] text-amber-400">Edit Profile</p>
                  <h2 className="mt-2 text-2xl font-black">Shape your Den.</h2>
                </div>
                <button onClick={() => setEditingProfile(false)} className="rounded-full border border-zinc-800 px-4 py-2 text-sm font-bold text-zinc-300">
                  Cancel
                </button>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Display name</span>
                  <input value={draftProfile.displayName} onChange={(event) => setDraftProfile((current) => ({ ...current, displayName: event.target.value }))} maxLength={40} className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-bold outline-none focus:border-amber-500" />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Handle</span>
                  <input value={draftProfile.handle} onChange={(event) => setDraftProfile((current) => ({ ...current, handle: event.target.value }))} maxLength={30} className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-bold outline-none focus:border-amber-500" />
                </label>
                <label className="space-y-2 sm:col-span-2">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Bio</span>
                  <textarea value={draftProfile.bio} onChange={(event) => setDraftProfile((current) => ({ ...current, bio: event.target.value }))} maxLength={180} rows={4} className="w-full resize-none rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-bold outline-none focus:border-amber-500" />
                </label>
              </div>

              <div className="mt-5 flex gap-3">
                <button onClick={saveProfile} className="rounded-2xl bg-amber-500 px-6 py-3 text-sm font-black text-zinc-950">
                  Save Profile
                </button>
                <button onClick={() => setEditingProfile(false)} className="rounded-2xl border border-zinc-800 px-6 py-3 text-sm font-bold text-zinc-300">
                  Discard
                </button>
              </div>
            </section>
          )}

          <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.35em] text-amber-400">My Roars</p>
                <h2 className="mt-3 max-w-lg text-3xl font-black tracking-tight">Everything you have shared.</h2>
              </div>
              <Link href="/den" className="rounded-3xl bg-amber-500 px-7 py-4 text-center text-sm font-black text-zinc-950">
                Create a Roar
              </Link>
            </div>
          </section>

          {roars.length === 0 ? (
            <section className="rounded-[2rem] border border-dashed border-zinc-800 bg-zinc-950/70 p-10 text-center">
              <h2 className="text-2xl font-black">Your Den is quiet.</h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-500">Your Roars will appear here when you start sharing on The Trail.</p>
            </section>
          ) : (
            <section className="space-y-4">
              {roars.map((roar) => (
                <article key={roar.id} className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-5">
                  <div className="flex items-start gap-4">
                    <Avatar profile={profile} size="sm" />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-black">{profile.displayName}</p>
                        <p className="text-sm font-bold text-zinc-500">{profile.handle}</p>
                        <p className="text-sm text-zinc-600">{roar.time}</p>
                      </div>
                      <span className="mt-2 inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-black text-amber-300">{roar.visibility}</span>
                    </div>
                  </div>
                  <p className="mt-5 whitespace-pre-wrap text-lg font-bold leading-8">{roar.text}</p>
                  <div className="mt-5 flex flex-wrap gap-3 text-sm font-black text-zinc-400">
                    <span className="rounded-full border border-zinc-800 px-4 py-2">{roar.pawsUp} Paws Up</span>
                    <span className="rounded-full border border-zinc-800 px-4 py-2">{roar.pawsDown} Paws Down</span>
                    <span className="rounded-full border border-zinc-800 px-4 py-2">{roar.comments.length} Comments</span>
                  </div>
                </article>
              ))}
            </section>
          )}
        </section>

        <aside className="hidden xl:block">
          <div className="sticky top-6">
            <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
              <div className="flex items-center gap-3">
                <Avatar profile={profile} size="sm" />
                <div>
                  <h2 className="text-2xl font-black">Account</h2>
                  <p className="text-sm font-bold text-zinc-500">{profile.handle}</p>
                </div>
              </div>
              <div className="mt-5 grid gap-2 text-sm font-bold">
                <button onClick={() => { setDraftProfile(profile); setEditingProfile(true); }} className="rounded-2xl border border-zinc-800 px-4 py-3 text-left text-zinc-200 hover:text-amber-300">
                  Profile Settings
                </button>
                <Link href="/settings" className="rounded-2xl border border-zinc-800 px-4 py-3 text-zinc-200 hover:text-amber-300">Account Settings</Link>
                <Link href="/settings#privacy" className="rounded-2xl border border-zinc-800 px-4 py-3 text-zinc-200 hover:text-amber-300">Privacy and Safety</Link>
                <Link href="/pack" className="rounded-2xl border border-zinc-800 px-4 py-3 text-zinc-200 hover:text-amber-300">Manage Pack</Link>
                <button className="rounded-2xl border border-red-500/30 px-4 py-3 text-left text-red-300 hover:bg-red-500/10">Log Out</button>
              </div>
            </section>
          </div>
        </aside>
      </div>
    </main>
  );
}
