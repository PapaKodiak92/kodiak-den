export type ProfileVisibility = "Public" | "Pack only" | "Private";

export type KodiakAccount = {
  email: string;
  handle: string;
  displayName: string;
  passwordHash: string;
  passwordSalt: string;
  emailVerified: boolean;
  verificationCodeHash?: string;
  verificationCodeSalt?: string;
  verificationExpiresAt?: string;
  verificationAttempts?: number;
  resetCodeHash?: string;
  resetCodeSalt?: string;
  resetExpiresAt?: string;
  resetAttempts?: number;
  failedSignInAttempts?: number;
  lockedUntil?: string;
  createdAt: string;
};

export type KodiakProfile = {
  displayName: string;
  handle: string;
  bio: string;
  bannerStyle: string;
  profileVisibility: ProfileVisibility;
  avatarImage: string | null;
  bannerImage: string | null;
};

export const profileStorageKey = "kodiak-den-local-profile";
export const accountStorageKey = "kodiak-den-account";
export const sessionStorageKey = "kodiak-den-session";
export const legacyRoarsStorageKey = "kodiak-den-local-roars";
export const securityInboxKey = "kodiak-den-security-inbox";

const encoder = new TextEncoder();

function bytesToHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function randomHex(bytes = 16) {
  const values = new Uint8Array(bytes);
  window.crypto.getRandomValues(values);
  return Array.from(values)
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

export function cleanHandle(value: string) {
  const cleaned = value.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9_@-]/g, "");
  return cleaned ? (cleaned.startsWith("@") ? cleaned : `@${cleaned}`) : "@kodiak";
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
}

export function passwordProblems(password: string) {
  const problems: string[] = [];
  if (password.length < 12) problems.push("Use at least 12 characters.");
  if (!/[a-z]/.test(password)) problems.push("Add a lowercase letter.");
  if (!/[A-Z]/.test(password)) problems.push("Add an uppercase letter.");
  if (!/[0-9]/.test(password)) problems.push("Add a number.");
  if (!/[^A-Za-z0-9]/.test(password)) problems.push("Add a symbol.");
  return problems;
}

export async function hashSecret(secret: string, salt = randomHex()) {
  const digest = await window.crypto.subtle.digest("SHA-256", encoder.encode(`${salt}:${secret}`));
  return { hash: bytesToHex(digest), salt };
}

export async function secretMatches(secret: string, hash: string, salt: string) {
  const result = await hashSecret(secret, salt);
  return result.hash === hash;
}

export function generateSixDigitCode() {
  const values = new Uint32Array(1);
  window.crypto.getRandomValues(values);
  return String(values[0] % 1_000_000).padStart(6, "0");
}

export function minutesFromNow(minutes: number) {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

export function isExpired(value?: string) {
  return !value || Date.now() > new Date(value).getTime();
}

export function readAccount() {
  try {
    const saved = window.localStorage.getItem(accountStorageKey);
    return saved ? (JSON.parse(saved) as KodiakAccount) : null;
  } catch {
    return null;
  }
}

export function saveAccount(account: KodiakAccount) {
  window.localStorage.setItem(accountStorageKey, JSON.stringify(account));
}

export function createSession(handle: string) {
  window.localStorage.setItem(
    sessionStorageKey,
    JSON.stringify({ signedInAt: new Date().toISOString(), handle: cleanHandle(handle) }),
  );
}

export function clearSession() {
  window.localStorage.removeItem(sessionStorageKey);
}

export function publishSecurityCode(kind: "verify" | "reset", code: string, email: string) {
  window.sessionStorage.setItem(
    securityInboxKey,
    JSON.stringify({ kind, code, email: normalizeEmail(email), createdAt: new Date().toISOString() }),
  );
}

export function readSecurityCode(kind: "verify" | "reset") {
  try {
    const saved = window.sessionStorage.getItem(securityInboxKey);
    if (!saved) return null;
    const payload = JSON.parse(saved) as { kind?: string; code?: string; email?: string; createdAt?: string };
    return payload.kind === kind && payload.code ? payload : null;
  } catch {
    return null;
  }
}

export function clearSecurityCode() {
  window.sessionStorage.removeItem(securityInboxKey);
}

export function createProfile(displayName: string, handle: string, profileVisibility: ProfileVisibility): KodiakProfile {
  return {
    displayName: displayName.trim().slice(0, 40),
    handle: cleanHandle(handle),
    bio: "Building my Den on Kodiak Den.",
    bannerStyle: "Pine Ridge",
    profileVisibility,
    avatarImage: null,
    bannerImage: null,
  };
}

export function saveProfile(profile: KodiakProfile) {
  window.localStorage.setItem(`kodiak-den-profile:${profile.handle}`, JSON.stringify(profile));
  window.localStorage.setItem(profileStorageKey, JSON.stringify(profile));
}

export function resetRoarsForHandle(handle: string) {
  window.localStorage.removeItem(legacyRoarsStorageKey);
  window.localStorage.setItem(`kodiak-den-roars:${cleanHandle(handle)}`, "[]");
}
