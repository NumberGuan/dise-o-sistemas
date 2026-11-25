import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const origin = "https://pastas.example.test";
const password = randomBytes(20).toString("hex");
const markers = {
  sales: "compras@distribuidoraelsol.com.ar",
  staff: "carlos.menem@example.com",
  production: "dejar reposar 20 minutos y laminar",
  maintenance: "PT-AM50-1001",
  purchases: "ventas@molinolaplata.com.ar",
};

test("La compilación de producción aplica los permisos a documentos y datos de navegación", async t => {
  const initialDirectory = process.cwd();
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "pastas-seguridad-"));
  process.chdir(directory);
  process.env.NODE_ENV = "production";
  process.env.SESSION_SECRET = randomBytes(32).toString("hex");
  try {
    const { createRequestHandler } = await import("react-router");
    const db = await import("../app/utils/db.server.ts");
    const app = createRequestHandler(await import("../build/server/index.js"), "production");
    const request = (url, { cookie, form, requestOrigin = origin } = {}) => {
      const headers = new Headers();
      if (cookie) headers.set("Cookie", cookie);
      if (form) headers.set("Origin", requestOrigin);
      return app(new Request(new URL(url, origin), { headers, ...(form && { method: "POST", body: new URLSearchParams(form) }) }));
    };
    const login = (email, secret = password) => request("/login", { form: { email, password: secret } });
    const accounts = {
      admin: { role: "Administrador" },
      ventas: { role: "Ventas" },
      produccion: { role: "Producción" },
      cliente: { role: "Cliente" },
      titular: { role: "Cliente", customerOrders: [{
        id: "pedido-titular", number: "PEDIDO-PRIVADO-TITULAR", clientId: "customer-titular",
        kind: "Regular", status: "Pendiente", date: "2026-11-05", deliveryDate: "",
        items: [], subtotal: 0, discount: 0, total: 0, deliveryAddressType: "client", observations: "",
      }] },
    };
    assert.deepEqual(await db.getUsers(), []);
    const passwordHash = db.hashPassword(password);
    const cookies = {};
    for (const [id, account] of Object.entries(accounts)) {
      await db.saveUser({ id, name: id, email: id + "@example.test", passwordHash, ...account });
      const response = await login(id + "@example.test");
      assert.equal(response.status, 302, id);
      const cookie = response.headers.get("Set-Cookie");
      assert.match(cookie, /; Secure/i);
      assert.match(cookie, /; HttpOnly/i);
      cookies[id] = cookie.split(";")[0];
    }

    await t.test("Cada módulo admite solo sus roles y el catálogo permanece público", async () => {
      assert.equal((await request("/catalogo")).status, 200);
      const sections = [
        [["admin", "ventas"], "/ventas", "/ventas/clientes", "/ventas/pedidos", "/ventas/comprobantes", "/ventas/presupuestos", "/ventas/remitos", "/ventas/devoluciones", "/ventas/donacion", "/ventas/caja", "/ventas/recibos"],
        [["admin", "produccion"], "/produccion", "/produccion/productos", "/produccion/materias-primas", "/produccion/ordenes", "/produccion/recetas", "/mantenimiento", "/mantenimiento/maquinas", "/mantenimiento/mantenimientos"],
        [["admin"], "/administracion", "/administracion/empleados", "/administracion/catalogos/cargos",
          "/compras/proveedores", "/compras/proveedores/nueva", "/compras/proveedores/1", "/compras/proveedores/1/modificar",
          "/compras/ordenes", "/compras/ordenes/nueva", "/compras/ordenes/1", "/compras/presupuesto-proveedor", "/compras/presupuesto-proveedor/1",
          "/compras/remito-proveedor", "/compras/remito-proveedor/1", "/compras/factura-proveedor", "/compras/factura-proveedor/1",
          "/compras/recibo-pago-proveedor", "/compras/recibo-pago-proveedor/1", "/compras/remitos"],
        [["cliente"], "/compras/catalogo", "/compras/carrito", "/compras/favoritos", "/compras/perfil", "/compras/pedidos"],
      ];
      for (const [allowed, ...urls] of sections) {
        for (const url of urls) {
          const anonymous = await request(url);
          assert.equal(anonymous.status, 302, url);
          assert.match(anonymous.headers.get("Location"), /^\/login\?/);
          for (const role of ["admin", "ventas", "produccion", "cliente"]) {
            const response = await request(url, { cookie: cookies[role] });
            assert.equal(response.status, allowed.includes(role) ? 200 : 403, role + " " + url);
            assert.match(response.headers.get("Cache-Control") ?? "", /no-store/);
            if (response.body) await response.body.cancel();
          }
        }
      }
      assert.equal((await request("/compras", { cookie: cookies.admin })).status, 200);
      assert.equal((await request("/compras", { cookie: cookies.cliente })).headers.get("Location"), "/compras/catalogo");
      assert.equal((await request("/produccion/maquinas", { cookie: cookies.produccion })).headers.get("Location"), "/mantenimiento/maquinas");
      assert.equal((await request("/produccion/maquinas", { cookie: cookies.cliente })).status, 403);
    });

    await t.test("Los datos y las acciones mantienen los permisos fuera de la interfaz", async () => {
      const paths = [
        ["/ventas/clientes.data", "produccion"],
        ["/compras/proveedores.data", "cliente"],
        ["/administracion/empleados.data", "ventas"],
        ["/compras/perfil.data", "admin"],
      ];
      for (const [url, role] of paths) {
        const response = await request(url, { cookie: cookies[role] });
        assert.equal(response.status, 403, url);
        assert.match(response.headers.get("Cache-Control") ?? "", /no-store/);
        const body = await response.text();
        for (const marker of [markers.staff, markers.purchases]) assert.ok(!body.includes(marker));
      }
      const own = await request("/compras/pedidos.data?pedido=pedido-titular", { cookie: cookies.titular });
      assert.equal(own.status, 200);
      assert.match(await own.text(), /PEDIDO-PRIVADO-TITULAR/);
      const other = await request("/compras/pedidos.data?pedido=pedido-titular", { cookie: cookies.cliente });
      assert.equal(other.status, 404);
      assert.doesNotMatch(await other.text(), /PEDIDO-PRIVADO-TITULAR/);
      const actions = [
        ["/ventas/clientes", "cliente"],
        ["/administracion/catalogos/cargos", "ventas"],
        ["/catalogos/unidades/crear", "cliente"],
        ["/compras/perfil", "admin"],
      ];
      for (const [url, role] of actions) {
        const response = await request(url, { cookie: cookies[role], form: { intent: "guardar" } });
        assert.equal(response.status, 403, url);
      }
      const crossOrigin = await request("/logout", {
        cookie: cookies.cliente, form: {}, requestOrigin: "https://other.example.test",
      });
      assert.equal(crossOrigin.status, 403);
      assert.equal((await request("/compras/perfil", { cookie: cookies.cliente })).status, 200);
    });

    await t.test("Las respuestas y los archivos públicos contienen únicamente datos pertinentes", async () => {
      const pages = [
        ["/catalogo", undefined, Object.values(markers)],
        ["/compras/perfil", cookies.cliente, [...Object.values(markers), "titular@example.test", passwordHash]],
        ["/ventas/clientes", cookies.ventas, [markers.staff, markers.production, markers.maintenance, markers.purchases, passwordHash]],
        ["/produccion/recetas", cookies.produccion, [markers.staff, markers.sales, markers.purchases, passwordHash]],
      ];
      for (const [url, cookie, hidden] of pages) {
        const response = await request(url, { cookie });
        assert.equal(response.status, 200);
        const body = await response.text();
        for (const marker of hidden) assert.ok(!body.includes(marker), url + " contiene información fuera de su ámbito");
      }
      const assets = new URL("../build/client/assets/", import.meta.url);
      for (const name of await fs.readdir(assets)) {
        if (!/\.(js|map|json)$/.test(name)) continue;
        const source = await fs.readFile(new URL(name, assets), "utf8");
        for (const marker of Object.values(markers)) assert.ok(!source.includes(marker), name + " contiene un registro interno");
      }
    });

    await t.test("El cierre, la desactivación y el cambio de contraseña revocan sesiones", async () => {
      assert.equal((await request("/logout", { cookie: cookies.cliente, form: {} })).status, 302);
      assert.equal((await request("/compras/perfil", { cookie: cookies.cliente })).status, 302);
      await db.mutateUser("titular", user => { user.customerStatus = "Inactivo"; });
      assert.equal((await request("/compras/perfil", { cookie: cookies.titular })).status, 302);
      assert.equal((await login("titular@example.test")).headers.get("Set-Cookie"), null);
      await db.mutateUser("titular", user => { user.customerStatus = "Activo"; });
      assert.equal((await request("/compras/perfil", { cookie: cookies.titular })).status, 302);
      await db.configureAdministrator("admin@example.test", randomBytes(20).toString("hex"));
      assert.equal((await request("/administracion", { cookie: cookies.admin })).status, 302);
      await db.saveUser({ id: "legacy", name: "Administrador anterior", email: "legacy@example.test", role: "Administrador", passwordHash: db.hashPassword("admin123") });
      assert.equal((await login("legacy@example.test", "admin123")).headers.get("Set-Cookie"), null);
    });
  } finally {
    process.chdir(initialDirectory);
    await fs.rm(directory, { recursive: true, force: true });
  }
});
