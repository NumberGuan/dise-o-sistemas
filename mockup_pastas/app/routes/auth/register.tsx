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

import { getUser } from "~/utils/session.server";
import { redirect } from "react-router";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await getUser(request);
  if (user) {
    return redirect("/");
  }
  return null;
};

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData();
  const name = formData.get("name");
  const email = formData.get("email");
  const password = formData.get("password");
  const role = formData.get("role") as Role;
  const adminCode = formData.get("adminCode");

  if (
    typeof name !== "string" || name.length < 3 ||
    typeof email !== "string" || !email.includes("@") ||
    typeof password !== "string" || password.length < 6 ||
    typeof role !== "string"
  ) {
    return { error: "Formulario inválido. Revisa los datos ingresados." };
  }

  if (!["Cliente", "Ventas", "Producción", "Administrador"].includes(role)) {
    return { error: "Perfil seleccionado no válido." };
  }

  // Prevent self-elevation to Administrador
  if (role === "Administrador") {
    // Basic hardcoded check for the mockup
    const secretCode = process.env.ADMIN_REGISTRATION_CODE || "ADMIN123";
    if (adminCode !== secretCode) {
      return { error: "Código de autorización administrativo incorrecto." };
    }
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

import { useState } from "react";

import AuthLayout from "~/components/AuthLayout";

export default function Register() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [selectedRole, setSelectedRole] = useState("Cliente");

  return (
    <AuthLayout
      title="Registro de Nuevo Operario"
      subtitle="Complete los datos para generar un nuevo usuario."
    >
      <Form method="post" className="space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nombre completo
            </label>
            <div className="relative mt-1 rounded-md shadow-sm">
              <input
                id="name"
                name="name"
                type="text"
                required
                minLength={3}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500 sm:text-sm"
                placeholder="Juan Pérez"
              />
            </div>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Correo corporativo o N° de Legajo
            </label>
            <div className="relative mt-1 rounded-md shadow-sm">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500 sm:text-sm"
                placeholder="op.maccaroni@fabricadepastas.com"
              />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Contraseña (mínimo 6 caracteres)
            </label>
            <div className="relative mt-1 rounded-md shadow-sm">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500 sm:text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              Área operativa de ingreso (Perfil)
            </label>
            <div className="relative mt-1 rounded-md shadow-sm">
              <select
                id="role"
                name="role"
                required
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500 sm:text-sm bg-white"
              >
                <option value="Administrador">Administrador</option>
                <option value="Ventas">Ventas</option>
                <option value="Producción">Producción</option>
                <option value="Cliente">Cliente</option>
              </select>
            </div>
          </div>
          
          {selectedRole === "Administrador" && (
            <div>
              <label htmlFor="adminCode" className="block text-sm font-medium text-gray-700">
                Código de autorización
              </label>
              <div className="relative mt-1 rounded-md shadow-sm">
                <input
                  id="adminCode"
                  name="adminCode"
                  type="password"
                  required
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500 sm:text-sm"
                  placeholder="Requerido para Administradores"
                />
              </div>
            </div>
          )}
        </div>

        {actionData?.error && (
          <div className="rounded-md bg-red-50 p-4 mt-4">
            <div className="text-sm text-red-700">{actionData.error}</div>
          </div>
        )}

        <div className="mt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full justify-center rounded-md border border-transparent bg-amber-700 py-3 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-70"
          >
            {isSubmitting ? "Registrando..." : "Confirmar Alta"}
          </button>
        </div>
      </Form>
    </AuthLayout>
  );
}
