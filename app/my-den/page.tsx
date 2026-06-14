"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import kodiakDenLogo from "../../assets/kodiak-den-logo.png";

type Visibility = "Public" | "Pack" | "Inner Den";
type ProfileVisibility = "Public" | "Pack only" | "Private";
type BannerStyle = "Kodiak Gold" | "Midnight Den" | "Pine Ridge";

type RoarComment = {
  id: string;
  author: string;
  handle: string;
  time: string;
  text: string;
};

type Roar = {
  id: string;
  author: string;
  handle: string;
  time: string;
  visibility: Visibility;
  text: string;
  pawprints: number;
  comments: RoarComment[];
  hasPawprinted: boolean;
};

type Profile = {
  displayName: string;
  handle: string;
  bio: string;
  bannerStyle: BannerStyle;
  profileVisibility: ProfileVisibility;
};

const roarsStorageKey = "kodiak-den-local-roars";
const profileStorageKey = "kodiak-den-local-profile";

const defaultProfile: Profile = {
  displayName: "Kodiak",
  handle: "@kodiak",
  bio: "Building Kodiak Den: a private corner of the internet for Roars, Pack, and quiet social connection without a creepy algorithm.",
  bannerStyle: "Kodiak Gold",
  profileVisibility: "Public",
};

const bannerStyles: Record<BannerStyle, string> = {
  "Kodiak Gold":
    "bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.36),_transparent_34%),linear-gradient(135deg,_rgba(245,158,11,0.22),_rgba(24,24,27,0.45),_rgba(5,6,8,1))]",
  "Midnight Den":
    "bg-[radial-gradient(circle_at_top_left,_rgba(113,113,122,0.28),_transparent_34%),linear-gradient(135deg,_rgba(39,39,42,0.92),_rgba(9,9,11,1),_rgba(5,6,8,1))]",
  "Pine Ridge":
    "bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.18),_transparent_34%),linear-gradient(135deg,_rgba(20,83,45,0.55),_rgba(24,24,27,0.55),_rgba(5,6,8,1))]",
};

const navItems = [
  { label: "The Trail", href: "/den" },
  { label: "My Den", href: "/my-den" },
  { label: "Pack", href: "/my-den" },
  { label: "Inner Den", href: "/my-den" },
  { label: "Settings", href: "/my-den" },
];

function KodiakBrand() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-transparent">
        <Image
          src={kodiakDenLogo}
          alt=""
          priority
          className="h-full w-full origin-top scale-[2.25] object-contain object-top"
        />
      </div>

      <div className="leading-none">
        <div className="flex items-baseline gap-2 text-2xl font-black tracking-tight">
          <span className="text-zinc-100">Kodiak</span>
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

function VisibilityBadge({ visibility }: { visibility: Visibility }) {
  return (
    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-black text-amber-300">
      {visibility}
    </span>
  );
}

function normalizeHandle(value: string) {
  const cleaned = value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_@-]/g, "");

  if (!cleaned) {
    return defaultProfile.handle;
  }

  return cleaned.startsWith("@") ? cleaned : `@${cleaned}`;
}

function normalizeStoredProfile(rawProfile: unknown): Profile {
  if (!rawProfile || typeof rawProfile !== "object") {
    return defaultProfile;
  }

  const storedProfile = rawProfile as Partial<Profile>;

  return {
    displayName:
      typeof storedProfile.displayName === "string" && storedProfile.displayName.trim()
        ? storedProfile.displayName.trim().slice(0, 40)
        : defaultProfile.displayName,
    handle:
      typeof storedProfile.handle === "string"
        ? normalizeHandle(storedProfile.handle)
        : defaultProfile.handle,
    bio:
      typeof storedProfile.bio === "string" && storedProfile.bio.trim()
        ? storedProfile.bio.trim().slice(0, 180)
        : defaultProfile.bio,
    bannerStyle:
      typeof storedProfile.bannerStyle === "string" && storedProfile.bannerStyle in bannerStyles
        ? (storedProfile.bannerStyle as BannerStyle)
        : defaultProfile.bannerStyle,
    profileVisibility:
      storedProfile.profileVisibility === "Pack only" ||
      storedProfile.profileVisibility === "Private" ||
      storedProfile.profileVisibility === "Public"
        ? storedProfile.profileVisibility
        : defaultProfile.profileVisibility,
  };
}

function normalizeStoredRoars(rawRoars: unknown): Roar[] {
  if (!Array.isArray(rawRoars)) {
    return [];
  }

  return rawRoars
    .filter((rawRoar) => rawRoar && typeof rawRoar === "object")
    .map((rawRoar) => {
      const storedRoar = rawRoar as Partial<Roar> & { comments?: unknown };
      const comments = Array.isArray(storedRoar.comments)
        ? storedRoar.comments.filter((comment): comment is RoarComment => {
            return Boolean(
              comment &&
                typeof comment === "object" &&
                "id" in comment &&
                "text" in comment &&
                typeof (comment as RoarComment).id === "string" &&
                typeof (comment as RoarComment).text === "string",
            );
          })
        : [];

      return {
        id: storedRoar.id ?? crypto.randomUUID(),
        author: storedRoar.author ?? defaultProfile.displayName,
        handle: storedRoar.handle ?? defaultProfile.handle,
        time: storedRoar.time ?? "now",
        visibility: storedRoar.visibility ?? "Public",
        text: storedRoar.text ?? "",
        pawprints: storedRoar.pawprints ?? 0,
        comments,
        hasPawprinted: storedRoar.hasPawprinted ?? false,
      };
    })
    .filter((roar) => roar.text.trim().length > 0);
}

export default function MyDenPage() {
  const [roars, setRoars] = useState<Roar[]>([]);
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [draftProfile, setDraftProfile] = useState<Profile>(defaultProfile);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedRoars = window.localStorage.getItem(roarsStorageKey);
    const savedProfile = window.localStorage.getItem(profileStorageKey);

    if (savedRoars) {
      try {
        setRoars(normalizeStoredRoars(JSON.parse(savedRoars)));
      } catch {
        window.localStorage.removeItem(roarsStorageKey);
      }
    }

    if (savedProfile) {
      try {
        const hydratedProfile = normalizeStoredProfile(JSON.parse(savedProfile));
        setProfile(hydratedProfile);
        setDraftProfile(hydratedProfile);
      } catch {
        window.localStorage.removeItem(profileStorageKey);
      }
    }

    setIsLoaded(true);
  }, []);

  const stats = useMemo(() => {
    const pawprints = roars.reduce((total, roar) => total + roar.pawprints, 0);
    const comments = roars.reduce((total, roar) => total + roar.comments.length, 0);

    return {
      roars: roars.length,
      pawprints,
      comments,
    };
  }, [roars]);

  function openProfileEditor() {
    setDraftProfile(profile);
    setIsEditingProfile(true);
  }

  function saveProfile() {
    const nextProfile = normalizeStoredProfile({
      ...draftProfile,
      handle: normalizeHandle(draftProfile.handle),
    });

    setProfile(nextProfile);
    setDraftProfile(nextProfile);
    window.localStorage.setItem(profileStorageKey, JSON.stringify(nextProfile));
    setIsEditingProfile(false);
  }

  function cancelProfileEdit() {
    setDraftProfile(profile);
    setIsEditingProfile(false);
  }

  return (
    <main className="min-h-screen bg-[#050608] text-zinc-100">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[240px_1fr_320px]">
        <aside className="hidden lg:block">
          <div className="sticky top-6 space-y-6">
            <KodiakBrand />

            <nav className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-3">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={
                    item.label === "My Den"
                      ? "block rounded-2xl bg-amber-500/10 px-4 py-3 text-sm font-black text-amber-300 ring-1 ring-amber-500/20"
                      : "block rounded-2xl px-4 py-3 text-sm font-bold text-zinc-300 transition hover:bg-zinc-900 hover:text-amber-300"
                  }
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        <section className="space-y-5">
          <header className="overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/30">
            <div className={`h-36 ${bannerStyles[profile.bannerStyle]}`} />

            <div className="p-5 pt-0">
              <div className="-mt-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div className="flex items-end gap-4">
                  <div className="grid h-24 w-24 place-items-center rounded-[2rem] border-4 border-zinc-950 bg-amber-500/10 text-5xl shadow-2xl shadow-black/50 ring-1 ring-amber-500/20">
                    🐾
                  </div>

                  <div className="pb-2">
                    <p className="text-3xl font-black tracking-tight">{profile.displayName}</p>
                    <p className="text-sm font-bold text-zinc-500">{profile.handle}</p>
                  </div>
                </div>

                <button
                  onClick={openProfileEditor}
                  className="rounded-full border border-zinc-800 px-5 py-2 text-sm font-bold text-zinc-300 transition hover:border-amber-500 hover:text-amber-300"
                >
                  Edit Profile
                </button>
              </div>

              <p className="mt-5 max-w-2xl whitespace-pre-wrap text-sm leading-6 text-zinc-400">
                {profile.bio}
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
                <span className="rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1 text-zinc-400">
                  Profile: {profile.profileVisibility}
                </span>
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-300">
                  {profile.bannerStyle}
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                  <p className="text-2xl font-black text-amber-300">{stats.roars}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Roars</p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                  <p className="text-2xl font-black text-amber-300">{stats.pawprints}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Pawprints</p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                  <p className="text-2xl font-black text-amber-300">{stats.comments}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Comments</p>
                </div>
              </div>
            </div>
          </header>

          {isEditingProfile ? (
            <section className="rounded-[2rem] border border-amber-500/20 bg-amber-500/10 p-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.3em] text-amber-400">
                    Edit Profile
                  </p>
                  <h2 className="mt-2 text-2xl font-black">Shape your Den.</h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
                    These changes are local to this browser for now. Later this becomes your real
                    account profile.
                  </p>
                </div>

                <button
                  onClick={cancelProfileEdit}
                  className="rounded-full border border-zinc-800 px-4 py-2 text-sm font-bold text-zinc-300 transition hover:border-zinc-600"
                >
                  Cancel
                </button>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
                    Display name
                  </span>
                  <input
                    value={draftProfile.displayName}
                    onChange={(event) =>
                      setDraftProfile((current) => ({
                        ...current,
                        displayName: event.target.value,
                      }))
                    }
                    maxLength={40}
                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-bold text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-amber-500"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
                    Handle
                  </span>
                  <input
                    value={draftProfile.handle}
                    onChange={(event) =>
                      setDraftProfile((current) => ({
                        ...current,
                        handle: event.target.value,
                      }))
                    }
                    maxLength={30}
                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-bold text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-amber-500"
                  />
                </label>

                <label className="space-y-2 sm:col-span-2">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
                    Bio
                  </span>
                  <textarea
                    value={draftProfile.bio}
                    onChange={(event) =>
                      setDraftProfile((current) => ({
                        ...current,
                        bio: event.target.value,
                      }))
                    }
                    maxLength={180}
                    rows={4}
                    className="w-full resize-none rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-bold leading-6 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-amber-500"
                  />
                  <span className="text-xs font-bold text-zinc-600">
                    {draftProfile.bio.length}/180
                  </span>
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
                    Banner style
                  </span>
                  <select
                    value={draftProfile.bannerStyle}
                    onChange={(event) =>
                      setDraftProfile((current) => ({
                        ...current,
                        bannerStyle: event.target.value as BannerStyle,
                      }))
                    }
                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-bold text-zinc-100 outline-none transition focus:border-amber-500"
                  >
                    <option>Kodiak Gold</option>
                    <option>Midnight Den</option>
                    <option>Pine Ridge</option>
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
                    Profile visibility
                  </span>
                  <select
                    value={draftProfile.profileVisibility}
                    onChange={(event) =>
                      setDraftProfile((current) => ({
                        ...current,
                        profileVisibility: event.target.value as ProfileVisibility,
                      }))
                    }
                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-bold text-zinc-100 outline-none transition focus:border-amber-500"
                  >
                    <option>Public</option>
                    <option>Pack only</option>
                    <option>Private</option>
                  </select>
                </label>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  onClick={cancelProfileEdit}
                  className="rounded-2xl border border-zinc-800 px-5 py-3 text-sm font-black text-zinc-300 transition hover:border-zinc-600"
                >
                  Discard
                </button>
                <button
                  onClick={saveProfile}
                  className="rounded-2xl bg-amber-500 px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-amber-400"
                >
                  Save Profile
                </button>
              </div>
            </section>
          ) : null}

          <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.3em] text-amber-400">My Roars</p>
                <h2 className="mt-2 text-2xl font-black">Everything you have posted locally.</h2>
              </div>

              <Link
                href="/den"
                className="rounded-full bg-amber-500 px-5 py-2 text-center text-sm font-black text-zinc-950 transition hover:bg-amber-400"
              >
                Create a Roar
              </Link>
            </div>
          </section>

          {!isLoaded || roars.length === 0 ? (
            <section className="rounded-[2rem] border border-dashed border-zinc-800 bg-zinc-950/70 p-8 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-amber-500/10 text-3xl ring-1 ring-amber-500/20">
                🐻
              </div>
              <h2 className="mt-5 text-2xl font-black">Your Den is quiet.</h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-500">
                Your profile starts empty. Post your first Roar on The Trail and it will show up here.
              </p>
              <Link
                href="/den"
                className="mt-5 inline-flex rounded-2xl bg-amber-500 px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-amber-400"
              >
                Go to The Trail
              </Link>
            </section>
          ) : (
            <div className="space-y-5">
              {roars.map((roar) => (
                <article key={roar.id} className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-black">{profile.displayName}</p>
                    <p className="text-sm text-zinc-500">{profile.handle}</p>
                    <p className="text-sm text-zinc-600">· {roar.time}</p>
                  </div>
                  <div className="mt-3">
                    <VisibilityBadge visibility={roar.visibility} />
                  </div>
                  <p className="mt-5 whitespace-pre-wrap text-lg font-semibold leading-8 text-zinc-100">{roar.text}</p>
                  <div className="mt-5 flex flex-wrap gap-3 text-sm font-black text-zinc-400">
                    <span className="rounded-full border border-zinc-800 px-4 py-2">🐾 {roar.pawprints} Pawprints</span>
                    <span className="rounded-full border border-zinc-800 px-4 py-2">💬 {roar.comments.length} Comments</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="hidden xl:block">
          <div className="sticky top-6 space-y-5">
            <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-5">
              <h2 className="text-lg font-black">Profile Privacy</h2>
              <p className="mt-1 text-sm leading-6 text-zinc-500">
                Your Den should show only what you choose to share.
              </p>
              <div className="mt-4 space-y-3 text-sm font-bold text-zinc-300">
                <p>✓ Profile visibility: {profile.profileVisibility}</p>
                <p>✓ Roars keep their visibility labels</p>
                <p>✓ Profile edits stay local for now</p>
                <p>✓ Export/delete planned before real launch</p>
              </div>
            </section>

            <section className="rounded-[2rem] border border-amber-500/20 bg-amber-500/10 p-5">
              <h2 className="text-lg font-black text-amber-300">Coming Next</h2>
              <div className="mt-4 space-y-3 text-sm font-bold text-zinc-300">
                <p>Profile avatar upload</p>
                <p>Banner image upload</p>
                <p>Delete or edit Roars</p>
                <p>Real account storage</p>
              </div>
            </section>
          </div>
        </aside>
      </div>
    </main>
  );
}
