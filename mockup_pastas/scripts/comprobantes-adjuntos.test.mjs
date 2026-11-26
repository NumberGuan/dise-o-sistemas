import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { matchRoutes } from "react-router";

test("Adjuntos de compras: persistencia, validación y permisos", async t => {
  const originalCwd = process.cwd();
  const project = fileURLToPath(new URL("../", import.meta.url));
  const sandbox = await fs.mkdtemp(path.join(os.tmpdir(), "pastas-adjuntos-"));
  const server = await createServer({ configFile: false, root: project, resolve: { alias: { "~": path.join(project, "app") } }, server: { middlewareMode: true, hmr: false }, appType: "custom", optimizeDeps: { noDiscovery: true, include: [] } });
  try {
    process.chdir(sandbox);
    const service = await server.ssrLoadModule("/app/data/purchase-attachments.server.ts");
    const route = await server.ssrLoadModule("/app/routes/compras/comprobante-adjunto.ts");
    const db = await server.ssrLoadModule("/app/utils/db.server.ts");
    const session = await server.ssrLoadModule("/app/utils/session.server.ts");
    const registration = await server.ssrLoadModule("/app/data/purchase-registration.server.ts");
    const newRoute = await server.ssrLoadModule("/app/routes/compras/comprobante-nuevo.tsx");
    const pdf = name => new File(["%PDF-1.4\ncomprobante de prueba"], name, { type: "application/pdf" });

    await t.test("Guarda cada tipo por separado y reemplaza el archivo", async () => {
      for (const kind of ["presupuesto", "factura", "recibo", "remito"]) {
        assert.equal(await service.readPurchaseAttachment(kind, "1"), null);
        await service.savePurchaseAttachment(kind, "1", pdf(`${kind}.pdf`));
      }
      await service.savePurchaseAttachment("factura", "1", pdf("nueva.pdf"));
      for (const kind of ["presupuesto", "factura", "recibo", "remito"]) {
        const stored = await service.readPurchaseAttachment(kind, "1");
        assert.equal(stored.name, kind === "factura" ? "nueva.pdf" : `${kind}.pdf`);
        assert.equal(Buffer.from(stored.content, "base64").toString(), "%PDF-1.4\ncomprobante de prueba");
      }
    });
    await t.test("Rechaza archivos vacíos, excedidos o de contenido incorrecto y conserva el anterior", async () => {
      const before = await service.readPurchaseAttachment("factura", "1");
      for (const file of [new File([], "vacio.pdf"), new File(["<script>alert(1)</script>"], "falso.pdf", { type: "application/pdf" }), new File(["%PDF-"], "archivo.html"), new File([new Uint8Array(10 * 1024 * 1024 + 1)], "grande.pdf")]) {
        await assert.rejects(service.savePurchaseAttachment("factura", "1", file));
      }
      assert.deepEqual(await service.readPurchaseAttachment("factura", "1"), before);
      for (const [kind, id] of [["orden", "1"], ["factura", "999999"], ["../factura", "1"], ["factura", "../1"]]) {
        await assert.rejects(service.readPurchaseAttachment(kind, id), error => error instanceof Response && error.status === 404);
        await assert.rejects(service.savePurchaseAttachment(kind, id, pdf("prueba.pdf")), error => error instanceof Response && error.status === 404);
      }
    });
    await t.test("Solo Administración puede subir, consultar y descargar", async () => {
      for (const role of ["Cliente", "Producción", "Ventas", "Administrador"]) {
        const user = { id: `adjuntos-${role}`, name: role, email: `${role}@example.test`, role, passwordHash: "unused" };
        await db.saveUser(user);
        const login = await session.createUserSession(user.id, "/");
        const cookie = login.headers.get("Set-Cookie").split(";")[0];
        const args = (method, download = false) => {
          const form = new FormData();
          form.set("file", pdf("original.pdf"));
          return { params: { kind: "factura", id: "1" }, request: new Request(`http://localhost/compras/comprobante-adjunto/factura/1${download ? "?download=1" : ""}`, { method, headers: { Cookie: cookie }, ...(method === "POST" ? { body: form } : {}) }) };
        };
        if (role === "Administrador") {
          assert.equal((await route.action(args("POST"))).attachment.name, "original.pdf");
          const metadata = await route.loader(args("GET"));
          assert.equal(metadata.attachment.name, "original.pdf");
          assert.equal("content" in metadata.attachment, false);
          const response = await route.loader(args("GET", true));
          assert.equal(response.headers.get("Content-Type"), "application/pdf");
          assert.match(response.headers.get("Content-Disposition"), /^attachment;/);
          assert.equal(await response.text(), "%PDF-1.4\ncomprobante de prueba");
        } else {
          await assert.rejects(route.action(args("POST")), error => error instanceof Response && error.status === 403);
          await assert.rejects(route.loader(args("GET")), error => error instanceof Response && error.status === 403);
          await assert.rejects(route.loader(args("GET", true)), error => error instanceof Response && error.status === 403);
        }
      }
    });
    await t.test("Registra documentos nuevos con su archivo y los incluye al recargar", async () => {
      const form = (numero, overrides = {}) => {
        const result = new FormData();
        for (const [key, value] of Object.entries({ numero, idProveedor: "1", fechaEmision: "2026-11-25", fechaVencimiento: "2026-12-25", idOrdenCompraProveedor: "1", importeIVA: "21", puntoVenta: "00001", detalle: JSON.stringify([{ idMateriaPrima: 1, cantidad: 2, precioUnitario: 50 }]), ...overrides })) result.set(key, value);
        result.set("file", pdf(`${numero}.pdf`));
        return result;
      };
      const budget = await registration.registerPurchaseDocument("presupuesto", form("PP-NUEVO"));
      const invoice = await registration.registerPurchaseDocument("factura", form("FC-NUEVA"));
      const remit = await registration.registerPurchaseDocument("remito", form("RM-NUEVO"));
      const receipt = await registration.registerPurchaseDocument("recibo", form("RP-NUEVO", { idComprobanteVentaProveedor: String(invoice.id), idMedioPago: "1", montoPagado: "50" }));
      const reloaded = await registration.getPurchaseData();
      assert.equal(reloaded.PRESUPUESTOS_PROVEEDOR.find(row => row.id === budget.id).numero, "PP-NUEVO");
      assert.equal(reloaded.COMPROBANTES_VENTA_PROVEEDOR.find(row => row.id === invoice.id).importeNeto, 100);
      assert.equal(reloaded.REMITOS.find(row => row.id === remit.id).numero, "RM-NUEVO");
      assert.equal(reloaded.RECIBOS_PAGO_PROVEEDOR.find(row => row.id === receipt.id).montoPagado, 50);
      for (const [kind, record] of [["presupuesto", budget], ["factura", invoice], ["remito", remit], ["recibo", receipt]]) {
        assert.equal((await service.readPurchaseAttachment(kind, String(record.id))).name, `${record.numero}.pdf`);
      }
      await assert.rejects(registration.registerPurchaseDocument("presupuesto", form("PP-NUEVO")), /Ya existe/);
      await assert.rejects(registration.registerPurchaseDocument("recibo", form("RP-EXCESO", { idComprobanteVentaProveedor: String(invoice.id), idMedioPago: "1", montoPagado: "100" })), /saldo/);
      await assert.rejects(registration.registerPurchaseDocument("factura", form("FC-INVALIDA", { idProveedor: "2" })), /orden de compra/);
      await assert.rejects(registration.registerPurchaseDocument("presupuesto", form("PP-INVALIDO", { fechaVencimiento: "2026-11-24" })), /vencimiento/);
      const noFile = form("PP-SIN-ARCHIVO"); noFile.delete("file");
      await assert.rejects(registration.registerPurchaseDocument("presupuesto", noFile), /archivo/);
      assert.equal((await registration.readPurchaseRegistrations()).length, 4);
    });
    await t.test("Los cuatro botones abren el formulario nuevo y sus rutas exigen Administración", async () => {
      const { default: routes } = await server.ssrLoadModule("/app/routes.ts");
      for (const section of ["presupuesto-proveedor", "factura-proveedor", "recibo-pago-proveedor", "remito-proveedor"]) {
        const matches = matchRoutes(routes, `/compras/${section}/nuevo`);
        assert.equal(matches.at(-1).route.file, "routes/compras/comprobante-nuevo.tsx");
        const user = await db.getUserById("adjuntos-Administrador");
        const login = await session.createUserSession(user.id, "/");
        const cookie = login.headers.get("Set-Cookie").split(";")[0];
        const loaded = await newRoute.loader({ request: new Request(`http://localhost/compras/${section}/nuevo`, { headers: { Cookie: cookie } }) });
        assert.ok(loaded.purchases.PRESUPUESTOS_PROVEEDOR.some(row => row.numero === "PP-NUEVO"));
        const salesLogin = await session.createUserSession("adjuntos-Ventas", "/");
        const salesCookie = salesLogin.headers.get("Set-Cookie").split(";")[0];
        for (const [handler, method] of [[newRoute.loader, "GET"], [newRoute.action, "POST"]]) {
          await assert.rejects(handler({ request: new Request(`http://localhost/compras/${section}/nuevo`, { method, headers: { Cookie: salesCookie } }) }), error => error instanceof Response && error.status === 403);
        }
      }
    });
  } finally {
    process.chdir(originalCwd);
    await server.close();
    assert.ok(sandbox.startsWith(os.tmpdir()) && path.basename(sandbox).startsWith("pastas-adjuntos-"));
    await fs.rm(sandbox, { recursive: true, force: true });
  }
});
