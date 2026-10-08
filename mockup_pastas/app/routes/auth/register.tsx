import { Form, Link, useActionData, useNavigation } from "react-router";
import crypto from "node:crypto";
import { createUserSession } from "~/utils/session.server";
import { getUserByEmail, saveUser, hashPassword, type Role } from "~/utils/db.server";
import type { Route } from "./+types/register";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "Registro | Fábrica de Pastas" },
  ];
};

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData();
  const name = formData.get("name");
  const email = formData.get("email");
  const password = formData.get("password");
  const role = formData.get("role") as Role;

  if (
    typeof name !== "string" || name.length < 3 ||
    typeof email !== "string" || !email.includes("@") ||
    typeof password !== "string" || password.length < 6 ||
    typeof role !== "string"
  ) {
    return { error: "Formulario inválido. Revisa los datos ingresados." };
  }

  // Prevent self-elevation to Administrador
  if (role === "Administrador") {
    return { error: "No puedes registrar una cuenta de Administrador públicamente." };
  }

  if (!["Cliente", "Ventas", "Producción"].includes(role)) {
    return { error: "Perfil seleccionado no válido." };
  }

  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    return { error: "El correo electrónico ya está registrado." };
  }

  const user = {
    id: crypto.randomUUID(),
    name,
    email,
    passwordHash: hashPassword(password),
    role,
  };

  await saveUser(user);

  return createUserSession(user.id, "/");
};

export default function Register() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-10 shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Crear cuenta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            O{" "}
            <Link to="/login" className="font-medium text-amber-600 hover:text-amber-500">
              inicia sesión si ya tienes una
            </Link>
          </p>
        </div>
        
        <Form method="post" className="mt-8 space-y-6">
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nombre completo
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                minLength={3}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500 sm:text-sm"
                placeholder="Juan Pérez"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500 sm:text-sm"
                placeholder="usuario@ejemplo.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña (mínimo 6 caracteres)
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500 sm:text-sm"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Perfil de usuario
              </label>
              <select
                id="role"
                name="role"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500 sm:text-sm"
              >
                <option value="Cliente">Cliente</option>
                <option value="Ventas">Ventas</option>
                <option value="Producción">Producción</option>
              </select>
            </div>
          </div>

          {actionData?.error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{actionData.error}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full justify-center rounded-md border border-transparent bg-amber-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-70"
            >
              {isSubmitting ? "Registrando..." : "Registrarse"}
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}
