import { createCookieSessionStorage, redirect } from "react-router";
import { getUserById, type User, type Role } from "./db.server";

const configuredSessionSecret = process.env.SESSION_SECRET?.trim();
if (!configuredSessionSecret && process.env.NODE_ENV === "production") {
  throw new Error("SESSION_SECRET es obligatorio en producción.");
}
const sessionSecret = configuredSessionSecret || "super-secret-mockup-key";

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "RP_session",
    secure: process.env.NODE_ENV === "production",
    secrets: [sessionSecret],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
  },
});

export async function createUserSession(userId: string, redirectTo: string) {
  const session = await sessionStorage.getSession();
  session.set("userId", userId);
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

export async function getUserId(request: Request) {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "string") return null;
  return userId;
}

export async function requireUserId(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) {
  const userId = await getUserId(request);
  if (!userId) {
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    throw redirect(`/login?${searchParams}`);
  }
  return userId;
}

export async function getUser(request: Request) {
  const userId = await getUserId(request);
  if (typeof userId !== "string") {
    return null;
  }

  try {
    const user = await getUserById(userId);
    return user || null;
  } catch {
    throw await logout(request);
  }
}

export async function logout(request: Request) {
  const session = await getUserSession(request);
  return redirect("/login", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}

export async function requireUserAndRole(request: Request, allowedRoles: Role[]) {
  const user = await getUser(request);
  if (!user) {
    const searchParams = new URLSearchParams([["redirectTo", new URL(request.url).pathname]]);
    throw redirect(`/login?${searchParams}`);
  }
  
  // Administrador has access to everything by default in our business logic
  if (!allowedRoles.includes(user.role) && user.role !== "Administrador") {
    // Instead of throwing a 403 ErrorBoundary, redirect them to the root
    // The root loader in home.tsx will route them to their permitted screen
    throw redirect("/");
  }
  return user;
}
