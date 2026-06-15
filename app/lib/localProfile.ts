export type KodiakProfile = {
  displayName: string;
  handle: string;
  bio: string;
  bannerStyle: string;
  profileVisibility: "Public" | "Pack only" | "Private";
  avatarImage: string | null;
  bannerImage: string | null;
};

export const profileStorageKey = "kodiak-den-local-profile";
export const accountStorageKey = "kodiak-den-account";
export const sessionStorageKey = "kodiak-den-session";

export const defaultKodiakProfile: KodiakProfile = {
  displayName: "Kodiak",
  handle: "@kodiak",
  bio: "Building Kodiak Den: a private corner of the internet for Roars, Pack, and quiet social connection.",
  bannerStyle: "Pine Ridge",
  profileVisibility: "Public",
  avatarImage: null,
  bannerImage: null,
};

export function cleanHandle(value: string) {
  const cleaned = value.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9_@-]/g, "");
  return cleaned ? (cleaned.startsWith("@") ? cleaned : `@${cleaned}`) : "@kodiak";
}

function normalizeImage(value: unknown) {
  return typeof value === "string" && value.startsWith("data:image/") ? value : null;
}

export function normalizeKodiakProfile(raw: unknown): KodiakProfile {
  if (!raw || typeof raw !== "object") return defaultKodiakProfile;

  const value = raw as Partial<KodiakProfile>;

  return {
    displayName:
      typeof value.displayName === "string" && value.displayName.trim()
        ? value.displayName.trim().slice(0, 40)
        : defaultKodiakProfile.displayName,
    handle: typeof value.handle === "string" ? cleanHandle(value.handle) : defaultKodiakProfile.handle,
    bio:
      typeof value.bio === "string" && value.bio.trim()
        ? value.bio.trim().slice(0, 180)
        : defaultKodiakProfile.bio,
    bannerStyle: typeof value.bannerStyle === "string" ? value.bannerStyle : defaultKodiakProfile.bannerStyle,
    profileVisibility:
      value.profileVisibility === "Pack only" || value.profileVisibility === "Private" || value.profileVisibility === "Public"
        ? value.profileVisibility
        : defaultKodiakProfile.profileVisibility,
    avatarImage: normalizeImage(value.avatarImage),
    bannerImage: normalizeImage(value.bannerImage),
  };
}

export function readKodiakProfile() {
  const saved = window.localStorage.getItem(profileStorageKey);
  if (!saved) return defaultKodiakProfile;

  try {
    return normalizeKodiakProfile(JSON.parse(saved));
  } catch {
    window.localStorage.removeItem(profileStorageKey);
    return defaultKodiakProfile;
  }
}

export function saveKodiakSession(profile: KodiakProfile, email?: string) {
  const account = {
    displayName: profile.displayName,
    handle: profile.handle,
    email: email?.trim().toLowerCase() ?? "",
  };

  window.localStorage.setItem(accountStorageKey, JSON.stringify(account));
  window.localStorage.setItem(
    sessionStorageKey,
    JSON.stringify({
      signedInAt: new Date().toISOString(),
      displayName: profile.displayName,
      handle: profile.handle,
    }),
  );
}

export function logOutOfKodiakDen() {
  window.localStorage.removeItem(sessionStorageKey);
}
