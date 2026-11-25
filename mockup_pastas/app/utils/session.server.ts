import { createCookieSessionStorage, redirect } from "react-router";
import { createHash, createHmac, randomBytes } from "node:crypto";
import { canAccessAccount, getUserById, mutateUser, type User, type Role } from "./db.server";
import { guestCartItems, mergeGuestCart } from "~/data/guest-cart";

const configuredSessionSecret = process.env.SESSION_SECRET?.trim();
if (process.env.NODE_ENV === "production" && (!configuredSessionSecret || configuredSessionSecret.length < 32)) {
  throw new Error("SESSION_SECRET debe tener al menos 32 caracteres en producción.");
}
const sessionSecret = configuredSessionSecret || randomBytes(32).toString("hex");
const sessionLifetime = 60 * 60 * 24 * 30;
const hashSessionToken = (token: string) => createHash("sha256").update(token).digest("hex");

function credentialVersion(user: User) {
  return createHmac("sha256", sessionSecret).update(user.id).update("\0").update(user.passwordHash).digest("hex");
}

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "RP_session",
    secure: process.env.NODE_ENV === "production",
    secrets: [sessionSecret],
    sameSite: "lax",
    path: "/",
    maxAge: sessionLifetime,
    httpOnly: true,
  },
});

export async function createUserSession(userId: string, redirectTo: string, request?: Request, expectedPasswordHash?: string) {
  const session = await sessionStorage.getSession(request?.headers.get("Cookie"));
  const cart = guestCartItems(session.get("guestCart"));
  if (request) await revokeSession(session.get("userId"), session.get("sessionToken"));

  const token = randomBytes(32).toString("hex");
  const now = Date.now();
  const user = await mutateUser(userId, user => {
    if (!canAccessAccount(user) || (expectedPasswordHash && expectedPasswordHash !== user.passwordHash)) {
      throw new Error("La cuenta no está habilitada.");
    }
    if (cart.length && user.role === "Cliente") user.cart = mergeGuestCart(user.cart ?? [], cart);
    user.sessions = [
      ...((user.sessions ?? []).filter(session => session.expiresAt > now).slice(-19)),
      { tokenHash: hashSessionToken(token), expiresAt: now + sessionLifetime * 1000 },
    ];
  });
  session.unset("guestCart");
  session.set("userId", userId);
  session.set("sessionToken", token);
  session.set("credentialVersion", credentialVersion(user));
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}

export async function getUserSession(request: Request) {
  const cookie = request.headers.get("Cookie");
  return sessionStorage.getSession(cookie);
}

export async function getUser(request: Request) {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  const token = session.get("sessionToken");
  if (typeof userId !== "string" || typeof token !== "string") return null;

  const user = await getUserById(userId);
  if (!user || !canAccessAccount(user) || session.get("credentialVersion") !== credentialVersion(user)) return null;
  const tokenHash = hashSessionToken(token);
  return user.sessions?.some(session => session.tokenHash === tokenHash && session.expiresAt > Date.now()) ? user : null;
}

async function revokeSession(userId: unknown, token: unknown) {
  if (typeof userId !== "string" || typeof token !== "string") return;
  const user = await getUserById(userId);
  const tokenHash = hashSessionToken(token);
  if (!user?.sessions?.some(session => session.tokenHash === tokenHash)) return;
  await mutateUser(userId, current => {
    current.sessions = current.sessions?.filter(session => session.tokenHash !== tokenHash);
  });
}

export async function logout(request: Request) {
  const session = await getUserSession(request);
  await revokeSession(session.get("userId"), session.get("sessionToken"));
  return redirect("/login", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}

export async function requireUser(request: Request) {
  const user = await getUser(request);
  if (!user) {
    const searchParams = new URLSearchParams([["redirectTo", new URL(request.url).pathname]]);
    throw redirect(`/login?${searchParams}`);
  }
  return user;
}

export async function requireUserAndRole(request: Request, allowedRoles: readonly Role[]) {
  const user = await requireUser(request);
  if (!allowedRoles.includes(user.role)) {
    throw new Response("No tenés permiso para acceder a esta sección.", { status: 403 });
  }
  return user;
}
