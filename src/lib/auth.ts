import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "mg_session";
const SESSION_DAYS = 7;

export type SessionUser = {
  userId: string;
  name: string;
  email: string;
  role: "ADMIN" | "DEPARTMENT" | "DOCTOR" | "PATIENT";
  /** ADMIN scope: null/undefined = super admin (global), string = country admin */
  countryId?: string | null;
  /** DEPARTMENT scope: the facility this account belongs to */
  facilityId?: string | null;
};

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET is missing or too short (set it in .env)");
  }
  return new TextEncoder().encode(secret);
}

/** Create a signed session JWT for the given user. */
export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecretKey());
}

/** Verify a session JWT and return its payload, or null when invalid/expired. */
export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (!payload.userId || !payload.role) return null;
    return {
      userId: payload.userId as string,
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as SessionUser["role"],
      countryId: (payload.countryId as string | null | undefined) ?? null,
      facilityId: (payload.facilityId as string | null | undefined) ?? null,
    };
  } catch {
    return null;
  }
}

/** Read the current session from the request cookies (server components/actions). */
export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Guard for server components/actions — throws when not logged in as allowed role. */
export async function requireRole(
  ...roles: Array<SessionUser["role"] | "DEPARTMENT">
): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  if (
    roles.length > 0 &&
    !roles.includes(session.role) &&
    !(roles.includes("DEPARTMENT") && session.role === "DEPARTMENT")
  ) {
    throw new Error("FORBIDDEN");
  }
  return session;
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
