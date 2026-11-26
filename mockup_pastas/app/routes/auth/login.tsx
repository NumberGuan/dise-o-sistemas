import AuthLayout from "~/components/AuthLayout";
import { data, redirect } from "react-router";
import { createUserSession, getUser } from "~/utils/session.server";
import { canAccessAccount, getUserByEmail, verifyPassword } from "~/utils/db.server";
import type { Route } from "./+types/login";
import { localRedirect } from "~/utils/redirect";
import { clearLoginAttempts, reserveLoginAttempt } from "~/utils/login-attempts.server";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "Iniciar Sesión | Fábrica de Pastas" },
  ];
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await getUser(request);
  if (user) {
    return redirect("/");
  }
  return null;
};

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData();
  const emailInput = formData.get("email");
  const password = formData.get("password");
  const requestedRedirect = formData.get("redirectTo");
  const redirectTo = localRedirect(requestedRedirect);

  if (typeof emailInput !== "string" || typeof password !== "string") {
    return { error: "Ingresá tu correo electrónico y contraseña." };
  }

  const email = emailInput.trim().toLocaleLowerCase("en-US");
  if (!email || email.length > 254 || password.length > 128) {
    return { error: "El correo o la contraseña no son válidos." };
  }

  const retryAfter = reserveLoginAttempt(email);
  if (retryAfter) {
    return data({ error: "Hubo demasiados intentos. Volvé a intentar en unos minutos." }, {
      status: 429, headers: { "Retry-After": String(retryAfter) },
    });
  }

  let user;
  try {
    user = await getUserByEmail(email);
  } catch {
    return { error: "No pudimos consultar las cuentas ahora. Intentá nuevamente más tarde." };
  }
  if (!user || !verifyPassword(password, user.passwordHash) || !canAccessAccount(user)) {
    return { error: "Credenciales incorrectas" };
  }

  try {
    const result = await createUserSession(user.id, redirectTo, request, user.passwordHash);
    clearLoginAttempts(email);
    return result;
  } catch {
    return { error: "No pudimos recuperar tu carrito. Intentá ingresar nuevamente." };
  }
};

export default function Login() {
  return <AuthLayout mode="login" />;
}
