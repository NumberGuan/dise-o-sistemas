import { configureAdministrator } from "../app/utils/db.server.ts";

try {
  await configureAdministrator(process.env.ADMIN_EMAIL ?? "", process.env.ADMIN_PASSWORD ?? "");
  console.log("Cuenta administradora configurada. Las sesiones anteriores de esta cuenta se cerraron.");
} catch (error) {
  console.error(error instanceof Error ? error.message : "No se pudo configurar la cuenta administradora.");
  process.exitCode = 1;
}
