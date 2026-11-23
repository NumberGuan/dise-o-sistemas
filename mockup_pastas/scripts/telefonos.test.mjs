import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

test("Teléfonos principales y adicionales", async t => {
  const originalCwd = process.cwd();
  const project = fileURLToPath(new URL("../", import.meta.url));
  const sandbox = await fs.mkdtemp(path.join(os.tmpdir(), "pastas-telefonos-"));
  const server = await createServer({ configFile: false, root: project, resolve: { alias: { "~": path.join(project, "app") } }, server: { middlewareMode: true, hmr: false }, appType: "custom", optimizeDeps: { noDiscovery: true, include: [] } });
  try {
    process.chdir(sandbox);
    await fs.mkdir("data");
    await fs.writeFile("data/users.json", "[]");
    const sales = await server.ssrLoadModule("/app/data/sales.server.ts");
    const model = await server.ssrLoadModule("/app/data/sales.ts");
    const suppliers = await server.ssrLoadModule("/app/data/proveedores.ts");
    const db = await server.ssrLoadModule("/app/utils/db.server.ts");
    const session = await server.ssrLoadModule("/app/utils/session.server.ts");
    const profile = await server.ssrLoadModule("/app/routes/compras/cliente-perfil.tsx");
    const initial = { ...model.SAMPLE_CLIENTS[0], name: "Cliente de prueba", phone: "11 4444-1111", additionalPhones: ["11 4444-2222", "11 4444-3333"] };

    await t.test("Los clientes antiguos conservan su principal y los nuevos guardan todos los números", async () => {
      const before = (await sales.getSalesData()).clients.find(client => client.id === initial.id);
      assert.equal(before.phone, model.SAMPLE_CLIENTS[0].phone);
      assert.equal(before.additionalPhones, undefined);
      await sales.saveSalesClient(initial, initial.id, "Administrador");
      const saved = JSON.parse(await fs.readFile("data/sales.json", "utf8")).clients.find(client => client.id === initial.id);
      assert.equal(saved.phone, initial.phone);
      assert.deepEqual(saved.additionalPhones, initial.additionalPhones);
      const { additionalPhones, ...legacyInput } = saved;
      await sales.saveSalesClient(legacyInput, saved.id, "Administrador");
      assert.deepEqual((await sales.getSalesData()).clients.find(client => client.id === saved.id).additionalPhones, additionalPhones);
    });

    await t.test("Rechaza duplicados y datos inválidos sin modificar el archivo existente", async () => {
      const before = await fs.readFile("data/sales.json", "utf8");
      for (const change of [
        { phone: "" }, { phone: "sin número" }, { additionalPhones: ["(11) 4444 1111"] },
        { additionalPhones: [""] }, { additionalPhones: ["9".repeat(41)] },
        { additionalPhones: "11 4444-2222" }, { additionalPhones: null },
        { additionalPhones: Array.from({ length: 21 }, (_, index) => String(index + 1)) },
      ]) await assert.rejects(sales.saveSalesClient({ ...initial, ...change }, initial.id, "Administrador"));
      assert.equal(await fs.readFile("data/sales.json", "utf8"), before);
    });

    await t.test("Ventas y Mi perfil comparten los teléfonos del cliente registrado", async () => {
      await db.saveUser({ id: "cliente-prueba", role: "Cliente", name: "Cliente de prueba", email: "cliente@example.test", passwordHash: "unused" });
      const id = "customer-cliente-prueba";
      await sales.saveSalesClient({ ...initial, type: "Particular", documentType: "DNI" }, id, "Administrador");
      const login = await session.createUserSession("cliente-prueba", "/");
      const cookie = login.headers.get("Set-Cookie").split(";")[0];
      const request = data => new Request("http://localhost/compras/perfil", { headers: { Cookie: cookie }, ...(data ? { method: "POST", body: data } : {}) });
      let loaded = (await profile.loader({ request: request() })).profile;
      assert.equal(loaded.phone, initial.phone);
      assert.deepEqual(loaded.additionalPhones, initial.additionalPhones);
      const form = new FormData();
      for (const key of ["name", "documentType", "cuitCuil", "ivaType", "notes"]) form.set(key, loaded[key]);
      form.set("addresses", JSON.stringify(loaded.addresses));
      form.set("phone", initial.additionalPhones[0]);
      form.set("additionalPhones", JSON.stringify([initial.phone]));
      assert.equal((await profile.action({ request: request(form) })).success, true);
      let client = (await sales.getSalesData()).clients.find(client => client.id === id);
      assert.equal(client.phone, initial.additionalPhones[0]);
      assert.deepEqual(client.additionalPhones, [initial.phone]);
      await sales.saveSalesClient({ ...client, additionalPhones: [] }, id, "Ventas");
      loaded = (await profile.loader({ request: request() })).profile;
      assert.deepEqual(loaded.additionalPhones, []);
      form.set("additionalPhones", JSON.stringify([loaded.phone]));
      assert.match((await profile.action({ request: request(form) })).error, /repetidos/);
      client = (await sales.getSalesData()).clients.find(client => client.id === id);
      assert.deepEqual(client.additionalPhones, []);
    });

    await t.test("Los proveedores conservan los adicionales al editar y permiten quitarlos", () => {
      const supplier = suppliers.getProveedores()[0];
      const address = suppliers.getDomicilioPorId(supplier.idDomicilio);
      const created = suppliers.createProveedor({ ...supplier, telefono: initial.phone, telefonosAdicionales: initial.additionalPhones }, address);
      assert.deepEqual(suppliers.getProveedorPorId(created.idPersona).telefonosAdicionales, initial.additionalPhones);
      suppliers.updateProveedor(created.idPersona, { ...created, telefono: initial.additionalPhones[0], telefonosAdicionales: [initial.phone] }, address);
      const updated = suppliers.getProveedorPorId(created.idPersona);
      assert.equal(updated.telefono, initial.additionalPhones[0]);
      assert.deepEqual(updated.telefonosAdicionales, [initial.phone]);
      assert.throws(() => suppliers.updateProveedor(updated.idPersona, { ...updated, telefonosAdicionales: [updated.telefono] }, address), /repetidos/);
      assert.deepEqual(suppliers.getProveedorPorId(updated.idPersona), updated);
      suppliers.updateProveedor(updated.idPersona, { ...updated, telefonosAdicionales: [] }, address);
      assert.deepEqual(suppliers.getProveedorPorId(updated.idPersona).telefonosAdicionales, []);
    });
  } finally {
    process.chdir(originalCwd);
    await server.close();
    const resolved = path.resolve(sandbox);
    assert.equal(path.dirname(resolved), path.resolve(os.tmpdir()));
    assert.ok(path.basename(resolved).startsWith("pastas-telefonos-"));
    await fs.rm(resolved, { recursive: true, force: true });
  }
});
