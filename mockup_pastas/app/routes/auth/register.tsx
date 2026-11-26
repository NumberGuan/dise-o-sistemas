import AuthLayout from "~/components/AuthLayout";
import { redirect } from "react-router";
import { localRedirect } from "~/utils/redirect";
import crypto from "node:crypto";
import { createUserSession, getUser } from "~/utils/session.server";
import { getUserByEmail, saveUser, hashPassword } from "~/utils/db.server";
import type { Route } from "./+types/register";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "Registro | Fábrica de Pastas" },
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
  const nameInput = formData.get("name");
  const emailInput = formData.get("email");
  const password = formData.get("password");

  if (typeof nameInput !== "string" || typeof emailInput !== "string" || typeof password !== "string") {
    return { error: "Revisá el nombre, el correo y la contraseña." };
  }

  const name = nameInput.trim();
  const email = emailInput.trim().toLocaleLowerCase("en-US");
  if (name.length < 2 || name.length > 100) return { error: "El nombre debe tener entre 2 y 100 caracteres." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return { error: "Ingresá un correo electrónico válido." };
  if (password.length < 6 || password.length > 128) return { error: "La contraseña debe tener entre 6 y 128 caracteres." };

  try {
    const existingUser = await getUserByEmail(email);
    if (existingUser) return { error: "El correo electrónico ya está registrado." };
  } catch {
    return { error: "No pudimos consultar las cuentas ahora. Intentá nuevamente más tarde." };
  }

  const user = {
    id: crypto.randomUUID(),
    name,
    email,
    passwordHash: hashPassword(password),
    role: "Cliente" as const,
  };

  try {
    await saveUser(user);
  } catch (error) {
    if (error instanceof Error && error.message === "User already exists") {
      return { error: "El correo electrónico ya está registrado." };
    }
    return { error: "No pudimos guardar tu cuenta. Intentá nuevamente más tarde." };
  }

  try {
    return await createUserSession(user.id, localRedirect(formData.get("redirectTo")), request);
  } catch {
    return { error: "Tu cuenta fue creada. Ingresá desde Iniciar sesión para recuperar el carrito y continuar." };
  }
};

export default function Register() {
  return <AuthLayout mode="register" />;
}
