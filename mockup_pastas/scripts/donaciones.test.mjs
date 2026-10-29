import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

test("Donaciones: destinatario, vencimiento, existencias y valor cero", async t => {
  const originalCwd = process.cwd();
  const project = fileURLToPath(new URL("../", import.meta.url));
  const sandbox = await fs.mkdtemp(path.join(os.tmpdir(), "pastas-donaciones-"));
  const server = await createServer({ configFile: false, root: project, resolve: { alias: { "~": path.join(project, "app") } }, server: { middlewareMode: true, hmr: false }, appType: "custom", optimizeDeps: { noDiscovery: true, include: [] } });
  try {
    process.chdir(sandbox);
    await fs.mkdir("data");
    await fs.writeFile("data/users.json", "[]");
    const model = await server.ssrLoadModule("/app/data/donaciones.ts");
    const service = await server.ssrLoadModule("/app/data/donaciones.server.ts");
    const sales = await server.ssrLoadModule("/app/data/sales.server.ts");
    const production = await server.ssrLoadModule("/app/data/produccion.ts");
    const route = await server.ssrLoadModule("/app/routes/ventas/donacion.tsx");
    const db = await server.ssrLoadModule("/app/utils/db.server.ts");
    const session = await server.ssrLoadModule("/app/utils/session.server.ts");
    const input = { clientId: "c-148", date: "2026-10-17", observations: "Entrega sin cargo", items: [{ productId: 1, quantity: 2, unitPrice: 5000, subtotal: 10000 }], total: 10000 };

    await t.test("Solo admite vencimientos desde la fecha elegida hasta siete días después", () => {
      const product = production.PRODUCTOS_PRODUCCION[0];
      assert.equal(model.canDonateProduct(product, "2026-10-13"), true);
      assert.equal(model.canDonateProduct(product, "2026-10-12"), false);
      assert.equal(model.canDonateProduct(product, "2026-10-20"), true);
      assert.equal(model.canDonateProduct(product, "2026-10-21"), false);
      assert.equal(model.canDonateProduct({ ...product, stockProducto: 0 }, input.date), false);
      assert.equal(model.canDonateProduct(product, "2026-02-30"), false);
    });
    await t.test("Persiste el destinatario y recalcula todos los importes a cero sin afectar Ventas", async () => {
      assert.deepEqual(await service.getDonations(), []);
      const before = await sales.getSalesData();
      const donation = await service.saveDonation(input, "Ventas");
      assert.equal(donation.number, "DON-000001");
      assert.equal(donation.clientName, "Distribuidora El Sol");
      assert.equal(donation.total, 0);
      assert.equal(donation.items[0].unitPrice, 0);
      assert.equal(donation.items[0].subtotal, 0);
      assert.equal(donation.items[0].expirationDate, "2026-10-20");
      assert.deepEqual(await service.getDonations(), [donation]);
      assert.deepEqual(await sales.getSalesData(), before);
      assert.equal(model.donationAvailability(production.PRODUCTOS_PRODUCCION[0], [donation]), 43);
    });
    await t.test("Rechaza clientes inválidos, cantidades inválidas y productos fuera del plazo", async () => {
      for (const clientId of ["", "inexistente", "consumidor-final", "c-144"]) await assert.rejects(service.saveDonation({ ...input, clientId }, "Ventas"), /cliente activo/);
      for (const quantity of [0, -1, 44, NaN, "1", 0.0001]) await assert.rejects(service.saveDonation({ ...input, items: [{ productId: 1, quantity }] }, "Ventas"));
      for (const productId of [999, 4, 5]) await assert.rejects(service.saveDonation({ ...input, items: [{ productId, quantity: 1 }] }, "Ventas"), /próximos/);
      for (const date of ["2026-02-30", "2099-01-01", "2026-10-21"]) await assert.rejects(service.saveDonation({ ...input, date }, "Ventas"));
      await assert.rejects(service.saveDonation({ ...input, items: [] }, "Ventas"), /al menos/);
      await assert.rejects(service.saveDonation({ ...input, items: [input.items[0], input.items[0]] }, "Ventas"), /repetidos/);
      assert.equal((await service.getDonations()).length, 1);
    });
    await t.test("Las altas concurrentes no permiten donar más existencias de las disponibles", async () => {
      const results = await Promise.allSettled([service.saveDonation({ ...input, items: [{ productId: 1, quantity: 30 }] }, "Ventas"), service.saveDonation({ ...input, items: [{ productId: 1, quantity: 30 }] }, "Administrador")]);
      assert.equal(results.filter(result => result.status === "fulfilled").length, 1);
      const donations = await service.getDonations();
      assert.equal(donations.length, 2);
      assert.equal(new Set(donations.map(donation => donation.number)).size, 2);
    });
    await t.test("Solo Ventas y Administración acceden y registran donaciones", async () => {
      for (const role of ["Cliente", "Compras", "Ventas", "Administrador"]) {
        const user = { id: `test-${role}`, name: role, email: `${role}@example.test`, role, passwordHash: "unused" };
        await db.saveUser(user);
        const login = await session.createUserSession(user.id, "/");
        const cookie = login.headers.get("Set-Cookie").split(";")[0];
        const request = method => {
          const form = new FormData();
          form.set("intent", "create");
          form.set("donation", JSON.stringify({ ...input, items: [{ productId: 1, quantity: 0.5 }] }));
          return new Request("http://localhost/ventas/donacion", { method, headers: { Cookie: cookie }, ...(method === "POST" ? { body: form } : {}) });
        };
        if (role === "Ventas" || role === "Administrador") {
          assert.ok((await route.loader({ request: request("GET") })).clients.length);
          assert.equal((await route.action({ request: request("POST") })).success, true);
        } else {
          for (const [handler, method] of [[route.loader, "GET"], [route.action, "POST"]]) await assert.rejects(handler({ request: request(method) }), error => error instanceof Response && error.status === 302);
          await assert.rejects(service.saveDonation(input, role), /permiso/);
        }
      }
    });
    await t.test("Un archivo dañado no se reemplaza ni se reinicia", async () => {
      await fs.writeFile("data/donaciones.json", "archivo dañado");
      await assert.rejects(service.getDonations(), /conservó/);
      await assert.rejects(service.saveDonation(input, "Ventas"), /conservó/);
      assert.equal(await fs.readFile("data/donaciones.json", "utf8"), "archivo dañado");
    });
  } finally {
    process.chdir(originalCwd);
    await server.close();
    assert.ok(sandbox.startsWith(os.tmpdir()) && path.basename(sandbox).startsWith("pastas-donaciones-"));
    await fs.rm(sandbox, { recursive: true, force: true });
  }
});
