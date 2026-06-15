import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { randomBytes, randomInt, scryptSync, timingSafeEqual } from "node:crypto";

export type ServerUser = {
  id: string;
  email: string;
  handle: string;
  displayName: string;
  passwordHash: string;
  passwordSalt: string;
  emailVerified: boolean;
  profileVisibility: "Public" | "Pack only" | "Private";
  failedSignInAttempts: number;
  lockedUntil?: string;
  createdAt: string;
  updatedAt: string;
};

type CodeKind = "verify" | "reset";

type CodeRecord = {
  id: string;
  userId: string;
  codeHash: string;
  codeSalt: string;
  kind: CodeKind;
  expiresAt: string;
  createdAt: string;
};

type SessionRecord = {
  tokenHash: string;
  tokenSalt: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
};

type AuthDb = {
  users: ServerUser[];
  codes: CodeRecord[];
  sessions: SessionRecord[];
};

const dataDir = path.join(process.cwd(), ".kodiak-data");
const dbPath = path.join(dataDir, "auth-db.json");
const maxFailedSignInAttempts = 5;
const lockoutMinutes = 10;
const sessionDays = 7;

function emptyDb(): AuthDb {
  return { users: [], codes: [], sessions: [] };
}

function readDb(): AuthDb {
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  if (!existsSync(dbPath)) {
    const db = emptyDb();
    writeDb(db);
    return db;
  }

  try {
    const parsed = JSON.parse(readFileSync(dbPath, "utf8")) as Partial<AuthDb>;
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      codes: Array.isArray(parsed.codes) ? parsed.codes : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    };
  } catch {
    const db = emptyDb();
    writeDb(db);
    return db;
  }
}

function writeDb(db: AuthDb) {
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

function nowIso() {
  return new Date().toISOString();
}

export function cleanHandle(value: string) {
  const cleaned = value.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9_@-]/g, "");
  return cleaned ? (cleaned.startsWith("@") ? cleaned : `@${cleaned}`) : "@kodiak";
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function passwordAllowed(value: string) {
  return value.length >= 6;
}

export function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function newId(prefix: string) {
  return `${prefix}_${randomBytes(16).toString("hex")}`;
}

function makeSalt() {
  return randomBytes(16).toString("hex");
}

function digest(secret: string, salt: string) {
  return scryptSync(secret, salt, 64).toString("hex");
}

function verifyDigest(secret: string, salt: string, expectedHash: string) {
  const actual = Buffer.from(digest(secret, salt), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export function createPasswordHash(password: string) {
  const passwordSalt = makeSalt();
  return { passwordSalt, passwordHash: digest(password, passwordSalt) };
}

export function verifyPassword(user: ServerUser, password: string) {
  return verifyDigest(password, user.passwordSalt, user.passwordHash);
}

export function makeCode() {
  return String(randomInt(100000, 1000000));
}

function createCodeRecord(userId: string, code: string, kind: CodeKind): CodeRecord {
  const codeSalt = makeSalt();
  return {
    id: newId("code"),
    userId,
    kind,
    codeSalt,
    codeHash: digest(code, codeSalt),
    expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
    createdAt: nowIso(),
  };
}

function publicAccount(user: ServerUser) {
  return {
    email: user.email,
    handle: user.handle,
    displayName: user.displayName,
    emailVerified: user.emailVerified,
    failedSignInAttempts: user.failedSignInAttempts,
    lockedUntil: user.lockedUntil,
    createdAt: user.createdAt,
  };
}

export function findUserByIdentifier(identifier: string) {
  const db = readDb();
  const email = normalizeEmail(identifier);
  const handle = cleanHandle(identifier);
  return db.users.find((user) => user.email === email || user.handle === handle) ?? null;
}

export function createUser(input: {
  email: string;
  handle: string;
  displayName: string;
  password: string;
  profileVisibility: "Public" | "Pack only" | "Private";
}) {
  const db = readDb();
  const email = normalizeEmail(input.email);
  const handle = cleanHandle(input.handle);

  if (!validEmail(email)) return { ok: false as const, error: "Use a valid email address." };
  if (!passwordAllowed(input.password)) return { ok: false as const, error: "Use at least 6 characters." };
  if (!input.displayName.trim()) return { ok: false as const, error: "Add a display name for your Den." };

  if (db.users.some((user) => user.email === email)) return { ok: false as const, error: "That email is already connected to a Den." };
  if (db.users.some((user) => user.handle === handle)) return { ok: false as const, error: "That handle is already taken." };

  const { passwordHash, passwordSalt } = createPasswordHash(input.password);
  const timestamp = nowIso();
  const user: ServerUser = {
    id: newId("user"),
    email,
    handle,
    displayName: input.displayName.trim().slice(0, 40),
    passwordHash,
    passwordSalt,
    emailVerified: false,
    profileVisibility: input.profileVisibility,
    failedSignInAttempts: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const code = makeCode();
  db.users.push(user);
  db.codes = db.codes.filter((record) => record.userId !== user.id || record.kind !== "verify");
  db.codes.push(createCodeRecord(user.id, code, "verify"));
  writeDb(db);

  return { ok: true as const, user: publicAccount(user), code };
}

export function issueVerification(identifier: string) {
  const db = readDb();
  const user = db.users.find((candidate) => candidate.email === normalizeEmail(identifier) || candidate.handle === cleanHandle(identifier));
  if (!user) return { ok: false as const, error: "Create your Den first." };

  const code = makeCode();
  user.emailVerified = false;
  user.updatedAt = nowIso();
  db.codes = db.codes.filter((record) => record.userId !== user.id || record.kind !== "verify");
  db.codes.push(createCodeRecord(user.id, code, "verify"));
  writeDb(db);

  return { ok: true as const, user: publicAccount(user), code };
}

export function verifyEmail(identifier: string, code: string) {
  const db = readDb();
  const user = db.users.find((candidate) => candidate.email === normalizeEmail(identifier) || candidate.handle === cleanHandle(identifier));
  if (!user) return { ok: false as const, error: "Create your Den first." };

  const record = db.codes.find((candidate) => candidate.userId === user.id && candidate.kind === "verify");
  if (!record) return { ok: false as const, error: "Send a new verification code." };
  if (Date.now() > new Date(record.expiresAt).getTime()) return { ok: false as const, error: "That verification code expired. Send a new code." };
  if (!verifyDigest(code.trim(), record.codeSalt, record.codeHash)) return { ok: false as const, error: "That verification code does not match." };

  user.emailVerified = true;
  user.updatedAt = nowIso();
  db.codes = db.codes.filter((candidate) => candidate.id !== record.id);
  writeDb(db);

  return { ok: true as const, user: publicAccount(user) };
}

export function issuePasswordReset(identifier: string) {
  const db = readDb();
  const user = db.users.find((candidate) => candidate.email === normalizeEmail(identifier) || candidate.handle === cleanHandle(identifier));
  if (!user) return { ok: true as const, user: null, code: null };

  const code = makeCode();
  db.codes = db.codes.filter((record) => record.userId !== user.id || record.kind !== "reset");
  db.codes.push(createCodeRecord(user.id, code, "reset"));
  writeDb(db);

  return { ok: true as const, user: publicAccount(user), code };
}

export function resetPassword(identifier: string, code: string, password: string) {
  const db = readDb();
  const user = db.users.find((candidate) => candidate.email === normalizeEmail(identifier) || candidate.handle === cleanHandle(identifier));
  if (!user) return { ok: false as const, error: "That reset code does not match." };
  if (!passwordAllowed(password)) return { ok: false as const, error: "Use at least 6 characters." };

  const record = db.codes.find((candidate) => candidate.userId === user.id && candidate.kind === "reset");
  if (!record) return { ok: false as const, error: "Request a new reset code." };
  if (Date.now() > new Date(record.expiresAt).getTime()) return { ok: false as const, error: "That reset code expired. Request a new one." };
  if (!verifyDigest(code.trim(), record.codeSalt, record.codeHash)) return { ok: false as const, error: "That reset code does not match." };

  const { passwordHash, passwordSalt } = createPasswordHash(password);
  user.passwordHash = passwordHash;
  user.passwordSalt = passwordSalt;
  user.failedSignInAttempts = 0;
  user.lockedUntil = undefined;
  user.updatedAt = nowIso();
  db.codes = db.codes.filter((candidate) => candidate.id !== record.id);
  db.sessions = db.sessions.filter((session) => session.userId !== user.id);
  writeDb(db);

  return { ok: true as const, user: publicAccount(user) };
}

export function accountIsLocked(user: ServerUser) {
  return Boolean(user.lockedUntil && Date.now() < new Date(user.lockedUntil).getTime());
}

export function lockoutText(user: ServerUser) {
  if (!user.lockedUntil) return "Try again later.";
  const remainingMs = Math.max(0, new Date(user.lockedUntil).getTime() - Date.now());
  const remainingMinutes = Math.max(1, Math.ceil(remainingMs / 60_000));
  return `Too many failed attempts. Try again in ${remainingMinutes} minute${remainingMinutes === 1 ? "" : "s"}.`;
}

export function signIn(identifier: string, password: string) {
  const db = readDb();
  const user = db.users.find((candidate) => candidate.email === normalizeEmail(identifier) || candidate.handle === cleanHandle(identifier));

  if (!user) return { ok: false as const, error: "Email, handle, or password is incorrect.", status: 401 };
  if (accountIsLocked(user)) return { ok: false as const, error: lockoutText(user), status: 423 };

  if (!verifyPassword(user, password)) {
    const failedSignInAttempts = (user.failedSignInAttempts ?? 0) + 1;
    user.failedSignInAttempts = failedSignInAttempts;
    user.lockedUntil = failedSignInAttempts >= maxFailedSignInAttempts ? new Date(Date.now() + lockoutMinutes * 60_000).toISOString() : undefined;
    user.updatedAt = nowIso();
    writeDb(db);

    return {
      ok: false as const,
      error: user.lockedUntil ? `Too many failed attempts. Try again in ${lockoutMinutes} minutes.` : "Email, handle, or password is incorrect.",
      status: user.lockedUntil ? 423 : 401,
    };
  }

  if (!user.emailVerified) {
    writeDb(db);
    return { ok: false as const, error: "Verify your email before signing in.", status: 403, code: "EMAIL_UNVERIFIED", user: publicAccount(user) };
  }

  user.failedSignInAttempts = 0;
  user.lockedUntil = undefined;
  user.updatedAt = nowIso();
  const token = randomBytes(32).toString("hex");
  const tokenSalt = makeSalt();
  const session: SessionRecord = {
    tokenSalt,
    tokenHash: digest(token, tokenSalt),
    userId: user.id,
    createdAt: nowIso(),
    expiresAt: new Date(Date.now() + sessionDays * 24 * 60 * 60_000).toISOString(),
  };

  db.sessions = db.sessions.filter((current) => Date.now() < new Date(current.expiresAt).getTime());
  db.sessions.push(session);
  writeDb(db);

  return { ok: true as const, user: publicAccount(user), token, expiresAt: session.expiresAt };
}

export function getSession(token: string | undefined) {
  if (!token) return null;
  const db = readDb();
  const session = db.sessions.find((candidate) => verifyDigest(token, candidate.tokenSalt, candidate.tokenHash));
  if (!session || Date.now() > new Date(session.expiresAt).getTime()) return null;
  const user = db.users.find((candidate) => candidate.id === session.userId);
  if (!user || !user.emailVerified) return null;
  return { user: publicAccount(user), expiresAt: session.expiresAt };
}

export function deleteSession(token: string | undefined) {
  if (!token) return;
  const db = readDb();
  db.sessions = db.sessions.filter((session) => !verifyDigest(token, session.tokenSalt, session.tokenHash));
  writeDb(db);
}
