import type { MiddlewareFunction } from "react-router";
import type { Role } from "./db.server";
import { requireUser, requireUserAndRole } from "./session.server";

export const requireSession: MiddlewareFunction<Response> = async ({ request }) => {
  await requireUser(request);
};

export function restrictTo(...roles: Role[]): MiddlewareFunction<Response> {
  return async ({ request }) => {
    await requireUserAndRole(request, roles);
  };
}

export const protectResponse: MiddlewareFunction<Response> = async ({ request }, next) => {
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const origin = request.headers.get("Origin");
    const site = request.headers.get("Sec-Fetch-Site");
    const configuredOrigin = process.env.APP_ORIGIN;
    const expectedOrigin = configuredOrigin ? new URL(configuredOrigin).origin : new URL(request.url).origin;
    if ((origin !== null && origin !== expectedOrigin) || site === "cross-site") {
      return new Response("Origen de la solicitud no permitido.", {
        status: 403,
        headers: { "Cache-Control": "private, no-store" },
      });
    }
  }

  const response = await next();
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "private, no-store");
  headers.append("Vary", "Cookie");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Content-Security-Policy", "frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};
