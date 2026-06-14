"use client";

import Image from "next/image";
import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import kodiakDenLogo from "../../assets/kodiak-den-logo.png";

type Visibility = "Public" | "Pack" | "Inner Den";
type ProfileVisibility = "Public" | "Pack only" | "Private";
type BannerStyle = "Kodiak Gold" | "Midnight Den" | "Pine Ridge";
type RoarReaction = "up" | "down" | null;
type ProfileImageField = "avatarImage" | "bannerImage";

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
  editedAt?: string;
  visibility: Visibility;
  text: string;
  pawsUp: number;
  pawsDown: number;
  reaction: RoarReaction;
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
const maxLocalImageBytes = 2.5 * 1024 * 1024;

const defaultProfile: Profile = {
  displayName: "Kodiak",
  handle: "@kodiak",
  bio: "Building Kodiak Den: a private corner of the internet for Roars, Pack, and quiet social connection without a creepy algorithm.",
  bannerStyle: "Kodiak Gold",
  profileVisibility: "Public",
  avatarImage: null,
  bannerImage: null,
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

function Avatar({ profile, size = "md" }: { profile: Profile; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-12 w-12 rounded-2xl text-sm",
    md: "h-16 w-16 rounded-3xl text-base",
    lg: "h-28 w-28 rounded-[2rem] text-2xl",
  }[size];

  return (
    <div
      className={`grid shrink-0 place-items-center overflow-hidden border border-amber-500/30 bg-amber-500/10 font-black tracking-tight text-amber-300 shadow-2xl shadow-black/40 ring-4 ring-[#050608] ${sizeClasses}`}
    >
      {profile.avatarImage ? (
        <img
          src={profile.avatarImage}
          alt={`${profile.displayName} profile avatar`}
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden="true">KD</span>
      )}
    </div>
  );
}

function formatLocalTime() {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());
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

function normalizeImage(value: unknown) {
  return typeof value === "string" && value.startsWith("data:image/") ? value : null;
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
    avatarImage: normalizeImage(storedProfile.avatarImage),
    bannerImage: normalizeImage(storedProfile.bannerImage),
  };
}

function normalizeStoredRoars(rawRoars: unknown): Roar[] {
  if (!Array.isArray(rawRoars)) {
    return [];
  }

  return rawRoars
    .filter((rawRoar) => rawRoar && typeof rawRoar === "object")
    .map((rawRoar) => {
      const storedRoar = rawRoar as Partial<Roar> & {
        comments?: unknown;
        pawprints?: number;
        hasPawprinted?: boolean;
      };
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

      const legacyPawprints = typeof storedRoar.pawprints === "number" ? storedRoar.pawprints : 0;
      const legacyReaction = storedRoar.hasPawprinted ? "up" : null;
      const reaction =
        storedRoar.reaction === "up" || storedRoar.reaction === "down"
          ? storedRoar.reaction
          : legacyReaction;

      return {
        id: storedRoar.id ?? crypto.randomUUID(),
        author: storedRoar.author ?? defaultProfile.displayName,
        handle: storedRoar.handle ?? defaultProfile.handle,
        time: storedRoar.time ?? "now",
        editedAt: typeof storedRoar.editedAt === "string" ? storedRoar.editedAt : undefined,
        visibility: storedRoar.visibility ?? "Public",
        text: storedRoar.text ?? "",
        pawsUp: storedRoar.pawsUp ?? legacyPawprints,
        pawsDown: storedRoar.pawsDown ?? 0,
        reaction,
        comments,
      };
    })
    .filter((roar) => roar.text.trim().length > 0);
}

function readImageAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Image could not be read."));
      }
    };

    reader.onerror = () => reject(new Error("Image could not be read."));
    reader.readAsDataURL(file);
  });
}

export default function MyDenPage() {
  const [roars, setRoars] = useState<Roar[]>([]);
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [draftProfile, setDraftProfile] = useState<Profile>(defaultProfile);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [editingRoarId, setEditingRoarId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [editVisibility, setEditVisibility] = useState<Visibility>("Public");

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

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    window.localStorage.setItem(roarsStorageKey, JSON.stringify(roars));
  }, [isLoaded, roars]);

  const stats = useMemo(() => {
    const pawsUp = roars.reduce((total, roar) => total + roar.pawsUp, 0);
    const pawsDown = roars.reduce((total, roar) => total + roar.pawsDown, 0);
    const comments = roars.reduce((total, roar) => total + roar.comments.length, 0);

    return {
      roars: roars.length,
      pawsUp,
      pawsDown,
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

  async function handleProfileImageUpload(
    field: ProfileImageField,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      window.alert("Choose an image file for your Den.");
      return;
    }

    if (file.size > maxLocalImageBytes) {
      window.alert("That image is too big for local mock storage. Keep it under 2.5 MB for now.");
      return;
    }

    try {
      const imageData = await readImageAsDataUrl(file);
      setDraftProfile((current) => ({
        ...current,
        [field]: imageData,
      }));
    } catch {
      window.alert("Could not read that image. Try another one.");
    }
  }

  function removeProfileImage(field: ProfileImageField) {
    setDraftProfile((current) => ({
      ...current,
      [field]: null,
    }));
  }

  function startEditingRoar(roar: Roar) {
    setEditingRoarId(roar.id);
    setEditDraft(roar.text);
    setEditVisibility(roar.visibility);
  }

  function cancelEditingRoar() {
    setEditingRoarId(null);
    setEditDraft("");
    setEditVisibility("Public");
  }

  function saveRoarEdit(roarId: string) {
    const cleanEdit = editDraft.trim();

    if (!cleanEdit) {
      return;
    }

    setRoars((currentRoars) =>
      currentRoars.map((roar) =>
        roar.id === roarId
          ? {
              ...roar,
              text: cleanEdit,
              visibility: editVisibility,
              editedAt: formatLocalTime(),
            }
          : roar,
      ),
    );

    cancelEditingRoar();
  }

  function deleteRoar(roarId: string) {
    const shouldDelete = window.confirm("Delete this Roar from your local Den?");

    if (!shouldDelete) {
      return;
    }

    setRoars((currentRoars) => currentRoars.filter((roar) => roar.id !== roarId));

    if (editingRoarId === roarId) {
      cancelEditingRoar();
    }
  }

  const bannerBackgroundStyle = profile.bannerImage
    ? {
        backgroundImage: `linear-gradient(135deg, rgba(5,6,8,0.15), rgba(5,6,8,0.62)), url(${profile.bannerImage})`,
      }
    : undefined;

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
            <div
              className={`h-60 bg-cover bg-center ${profile.bannerImage ? "" : bannerStyles[profile.bannerStyle]}`}
              style={bannerBackgroundStyle}
            />

            <div className="px-6 pb-8 sm:px-8 sm:pb-9">
              <div className="-mt-8 flex flex-col justify-between gap-7 sm:flex-row sm:items-end">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:gap-5">
                  <Avatar profile={profile} size="lg" />

                  <div className="pb-2 sm:pb-4">
                    <p className="text-4xl font-black tracking-tight">{profile.displayName}</p>
                    <p className="mt-1 text-sm font-bold text-zinc-500">{profile.handle}</p>
                  </div>
                </div>

                <button
                  onClick={openProfileEditor}
                  className="w-fit rounded-full border border-zinc-800 px-5 py-2 text-sm font-bold text-zinc-300 transition hover:border-amber-500 hover:text-amber-300"
                >
                  Edit Profile
                </button>
              </div>

              <p className="mt-8 max-w-2xl whitespace-pre-wrap text-sm leading-6 text-zinc-400">
                {profile.bio}
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
                <span className="rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1 text-zinc-400">
                  Profile: {profile.profileVisibility}
                </span>
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-300">
                  {profile.bannerImage ? "Custom banner" : profile.bannerStyle}
                </span>
                <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-purple-200">
                  {profile.avatarImage ? "Custom avatar" : "Default avatar"}
                </span>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                  <p className="text-2xl font-black text-amber-300">{stats.roars}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Roars</p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                  <p className="text-2xl font-black text-amber-300">{stats.pawsUp}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Paws Up</p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                  <p className="text-2xl font-black text-red-300">{stats.pawsDown}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Paws Down</p>
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
                    Uploads stay inside this browser for now. Real account storage comes later.
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
                <section className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Profile picture</p>
                  <div className="mt-4 flex items-center gap-4">
                    <Avatar profile={draftProfile} size="md" />
                    <div className="space-y-2">
                      <label className="inline-flex cursor-pointer rounded-2xl bg-amber-500 px-4 py-2 text-sm font-black text-zinc-950 transition hover:bg-amber-400">
                        Upload avatar
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) => handleProfileImageUpload("avatarImage", event)}
                          className="hidden"
                        />
                      </label>
                      {draftProfile.avatarImage ? (
                        <button
                          onClick={() => removeProfileImage("avatarImage")}
                          className="block rounded-2xl border border-zinc-800 px-4 py-2 text-sm font-bold text-zinc-400 transition hover:border-red-500/50 hover:text-red-300"
                        >
                          Remove avatar
                        </button>
                      ) : null}
                    </div>
                  </div>
                </section>

                <section className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Banner image</p>
                  <div
                    className={`mt-4 h-24 rounded-2xl border border-zinc-800 bg-cover bg-center ${
                      draftProfile.bannerImage ? "" : bannerStyles[draftProfile.bannerStyle]
                    }`}
                    style={
                      draftProfile.bannerImage
                        ? {
                            backgroundImage: `linear-gradient(135deg, rgba(5,6,8,0.08), rgba(5,6,8,0.58)), url(${draftProfile.bannerImage})`,
                          }
                        : undefined
                    }
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <label className="inline-flex cursor-pointer rounded-2xl bg-amber-500 px-4 py-2 text-sm font-black text-zinc-950 transition hover:bg-amber-400">
                      Upload banner
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => handleProfileImageUpload("bannerImage", event)}
                        className="hidden"
                      />
                    </label>
                    {draftProfile.bannerImage ? (
                      <button
                        onClick={() => removeProfileImage("bannerImage")}
                        className="rounded-2xl border border-zinc-800 px-4 py-2 text-sm font-bold text-zinc-400 transition hover:border-red-500/50 hover:text-red-300"
                      >
                        Remove banner
                      </button>
                    ) : null}
                  </div>
                </section>

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
                    Banner fallback style
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
                  className="rounded-2xl border border-zinc-800 px-5 py-3 text-sm font-bold text-zinc-300 transition hover:border-zinc-600"
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

          <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.3em] text-amber-400">My Roars</p>
                <h1 className="mt-3 text-2xl font-black leading-tight sm:text-3xl">
                  Everything you have posted locally.
                </h1>
              </div>

              <Link
                href="/den"
                className="rounded-3xl bg-amber-500 px-8 py-4 text-center text-sm font-black text-zinc-950 transition hover:bg-amber-400"
              >
                Create a Roar
              </Link>
            </div>
          </section>

          {roars.length === 0 ? (
            <section className="rounded-[2rem] border border-dashed border-zinc-800 bg-zinc-950/70 p-10 text-center">
              <h2 className="text-2xl font-black">Your Den is quiet.</h2>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-zinc-500">
                Your local Roars will show here after you post from The Trail.
              </p>
            </section>
          ) : (
            <div className="space-y-4">
              {roars.map((roar) => (
                <article
                  key={roar.id}
                  className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar profile={profile} size="sm" />
                      <div>
                        <p className="font-black">
                          {profile.displayName}{" "}
                          <span className="font-medium text-zinc-500">{profile.handle}</span>{" "}
                          <span className="font-medium text-zinc-600">- {roar.time}</span>
                          {roar.editedAt ? (
                            <span className="font-medium text-zinc-600"> - edited {roar.editedAt}</span>
                          ) : null}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditingRoar(roar)}
                        className="rounded-full border border-zinc-800 px-3 py-1 text-xs font-bold text-zinc-400 transition hover:border-amber-500/50 hover:text-amber-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteRoar(roar.id)}
                        className="rounded-full border border-zinc-800 px-3 py-1 text-xs font-bold text-zinc-400 transition hover:border-red-500/50 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <VisibilityBadge visibility={roar.visibility} />
                  </div>

                  {editingRoarId === roar.id ? (
                    <div className="mt-5 rounded-3xl border border-amber-500/20 bg-amber-500/10 p-4">
                      <textarea
                        value={editDraft}
                        onChange={(event) => setEditDraft(event.target.value)}
                        rows={4}
                        className="w-full resize-none rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-bold leading-6 text-zinc-100 outline-none transition focus:border-amber-500"
                      />

                      <div className="mt-3 flex flex-wrap gap-2">
                        {(["Public", "Pack", "Inner Den"] as Visibility[]).map((visibility) => (
                          <button
                            key={visibility}
                            onClick={() => setEditVisibility(visibility)}
                            className={
                              editVisibility === visibility
                                ? "rounded-full border border-amber-500/50 bg-amber-500/20 px-4 py-2 text-xs font-black text-amber-300"
                                : "rounded-full border border-zinc-800 px-4 py-2 text-xs font-bold text-zinc-400 hover:border-amber-500/40 hover:text-amber-300"
                            }
                          >
                            {visibility}
                          </button>
                        ))}
                      </div>

                      <div className="mt-4 flex flex-wrap justify-end gap-2">
                        <button
                          onClick={cancelEditingRoar}
                          className="rounded-2xl border border-zinc-800 px-4 py-2 text-sm font-bold text-zinc-400 transition hover:border-zinc-600"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => saveRoarEdit(roar.id)}
                          disabled={!editDraft.trim()}
                          className="rounded-2xl bg-amber-500 px-4 py-2 text-sm font-black text-zinc-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
                        >
                          Save Roar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-6 whitespace-pre-wrap text-lg font-bold leading-8">{roar.text}</p>
                  )}

                  <div className="mt-6 flex flex-wrap gap-3 text-sm font-black text-zinc-400">
                    <span className="rounded-full border border-zinc-800 px-5 py-2">
                      {roar.pawsUp} Paws Up
                    </span>
                    <span className="rounded-full border border-zinc-800 px-5 py-2">
                      {roar.pawsDown} Paws Down
                    </span>
                    <span className="rounded-full border border-zinc-800 px-5 py-2">
                      {roar.comments.length} Comments
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="hidden xl:block">
          <div className="sticky top-6 space-y-5">
            <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
              <h2 className="text-xl font-black">Profile Privacy</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-500">
                Your Den should show only what you choose to share.
              </p>
              <div className="mt-5 grid gap-3 text-sm font-bold text-zinc-100">
                <p>OK Profile visibility: {profile.profileVisibility}</p>
                <p>OK Avatar and banner stay local for now</p>
                <p>OK Roars keep their visibility labels</p>
                <p>OK Edit/delete your local Roars</p>
                <p>OK Paws Up and Paws Down stay local for now</p>
              </div>
            </section>

            <section className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5">
              <h2 className="text-xl font-black text-amber-300">Coming Next</h2>
              <div className="mt-5 grid gap-3 text-sm font-bold text-zinc-100">
                <p>Pack page</p>
                <p>Inner Den controls</p>
                <p>Real account storage</p>
                <p>Export/delete profile package</p>
              </div>
            </section>
          </div>
        </aside>
      </div>
    </main>
  );
}
