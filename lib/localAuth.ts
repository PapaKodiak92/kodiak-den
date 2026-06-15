export type ProfileVisibility = "Public" | "Pack only" | "Private";

export type LocalAccount = {
  email: string;
  handle: string;
  displayName: string;
  credentialHash?: string;
  credentialSalt?: string;
  emailVerified?: boolean;
  verificationCode?: string;
  verificationExpiresAt?: string;
  resetCode?: string;
  resetExpiresAt?: string;
  failedSignInAttempts?: number;
  lockedUntil?: string;
  createdAt?: string;
};

export const accountStorageKey = "kodiak-den-account";
export const sessionStorageKey = "kodiak-den-session";
export const profileStorageKey = "kodiak-den-local-profile";
export const legacyRoarsStorageKey = "kodiak-den-local-roars";

export function cleanHandle(value: string) {
  const cleaned = value.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9_@-]/g, "");
  return cleaned ? (cleaned.startsWith("@") ? cleaned : `@${cleaned}`) : "@kodiak";
}

export function passwordAllowed(value: string) {
  return value.length >= 6;
}

export function strongEnough(value: string) {
  return passwordAllowed(value);
}

function toHex(values: Uint8Array) {
  return Array.from(values).map((value) => value.toString(16).padStart(2, "0")).join("");
}

export function makeCode() {
  const values = new Uint32Array(1);
  window.crypto.getRandomValues(values);
  return String(values[0] % 1_000_000).padStart(6, "0");
}

export function makeSalt() {
  const values = new Uint8Array(16);
  window.crypto.getRandomValues(values);
  return toHex(values);
}

export async function makeDigest(secret: string, salt: string) {
  const data = new TextEncoder().encode(`${salt}:${secret}`);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  return toHex(new Uint8Array(digest));
}

export async function createCredential(password: string) {
  const credentialSalt = makeSalt();
  const credentialHash = await makeDigest(password, credentialSalt);
  return { credentialSalt, credentialHash };
}

export function readAccount(): LocalAccount | null {
  if (typeof window === "undefined") return null;

  try {
    const saved = window.localStorage.getItem(accountStorageKey);
    return saved ? (JSON.parse(saved) as LocalAccount) : null;
  } catch {
    return null;
  }
}

export function writeAccount(account: LocalAccount) {
  window.localStorage.setItem(accountStorageKey, JSON.stringify(account));
}

export function identifierMatches(account: LocalAccount, identifier: string) {
  const value = identifier.trim().toLowerCase();
  if (!value) return false;
  return account.email.toLowerCase() === value || cleanHandle(account.handle) === cleanHandle(value);
}

export function accountIsLocked(account: LocalAccount) {
  return Boolean(account.lockedUntil && Date.now() < new Date(account.lockedUntil).getTime());
}

export function lockoutText(account: LocalAccount) {
  if (!account.lockedUntil) return "Try again later.";
  const remainingMs = Math.max(0, new Date(account.lockedUntil).getTime() - Date.now());
  const remainingMinutes = Math.max(1, Math.ceil(remainingMs / 60_000));
  return `Too many failed attempts. Try again in ${remainingMinutes} minute${remainingMinutes === 1 ? "" : "s"}.`;
}

export async function verifyCredential(account: LocalAccount, password: string) {
  if (!account.credentialSalt || !account.credentialHash) return false;
  const nextHash = await makeDigest(password, account.credentialSalt);
  return nextHash === account.credentialHash;
}

export function setSignedInSession(account: LocalAccount) {
  window.localStorage.setItem(
    sessionStorageKey,
    JSON.stringify({ signedInAt: new Date().toISOString(), handle: cleanHandle(account.handle) }),
  );
}

export function clearSignedInSession() {
  window.localStorage.removeItem(sessionStorageKey);
}

export function issueEmailVerification(account: LocalAccount) {
  const verificationCode = makeCode();
  const updated: LocalAccount = {
    ...account,
    emailVerified: false,
    verificationCode,
    verificationExpiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
  };

  writeAccount(updated);
  return updated;
}

export function issuePasswordReset(account: LocalAccount) {
  const resetCode = makeCode();
  const updated: LocalAccount = {
    ...account,
    resetCode,
    resetExpiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
  };

  writeAccount(updated);
  return updated;
}
