import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

test("Administración: catálogos persistentes y opciones compartidas", async t => {
  const originalCwd = process.cwd();
  const project = fileURLToPath(new URL("../", import.meta.url));
  const sandbox = await fs.mkdtemp(path.join(os.tmpdir(), "pastas-administracion-"));
  const server = await createServer({ configFile: false, root: project, resolve: { alias: { "~": path.join(project, "app") } }, server: { middlewareMode: true, hmr: false }, appType: "custom", optimizeDeps: { noDiscovery: true, include: [] } });
  try {
    process.chdir(sandbox);
    await fs.mkdir("data");
    await fs.writeFile("data/users.json", "[]");
    const catalogs = await server.ssrLoadModule("/app/data/catalogs.server.ts");
    const model = await server.ssrLoadModule("/app/data/catalogs.ts");
    const salesModel = { ...await server.ssrLoadModule("/app/data/sales.ts"), ...await server.ssrLoadModule("/app/data/sales-fixtures.server.ts") };
    const sales = await server.ssrLoadModule("/app/data/sales.server.ts");
    const billing = await server.ssrLoadModule("/app/data/billing.server.ts");
    const db = await server.ssrLoadModule("/app/utils/db.server.ts");
    const session = await server.ssrLoadModule("/app/utils/session.server.ts");
    const route = await server.ssrLoadModule("/app/routes/administracion/catalogos.tsx");
    const form = (name, extra = {}) => {
      const data = new FormData();
      for (const [key, value] of Object.entries({ intent: "save", name, description: "Descripción de prueba", active: "true", ...extra })) data.set(key, value);
      return data;
    };
    const save = (key, name, extra) => catalogs.saveCatalogEntry(key, form(name, extra));
    let client, delivery, payment;

    await t.test("Los 16 catálogos conservan los identificadores de los registros existentes", async () => {
      const data = await catalogs.getCatalogs();
      assert.equal(Object.keys(data).length, 16);
      assert.equal(data["tipos-documento"].find(item => item.id === "1").value, "CUIT");
      assert.equal(data.unidades.find(item => item.id === "5").value, "docena");
      await assert.rejects(fs.access("data/catalogs.json"), { code: "ENOENT" });
    });
    await t.test("Los tipos de máquina se incorporan a catálogos existentes y conservan las selecciones históricas", async () => {
      const previous = catalogs.initialCatalogs();
      delete previous["tipos-maquina"];
      await fs.writeFile("data/catalogs.json", JSON.stringify(previous));
      const initial = await catalogs.getCatalogs();
      assert.deepEqual(initial["tipos-maquina"].map(item => item.value), ["Amasadora", "Sobadora", "Formadora", "Secadero"]);
      const created = await save("tipos-maquina", "Envasadora");
      let data = await catalogs.getCatalogs();
      assert.equal(model.validCatalogValue(data, "tipos-maquina", created.value), true);
      await assert.rejects(save("tipos-maquina", "  ENVASADORA  "), /Ya existe/);
      await save("tipos-maquina", "Envasadora automática", { id: created.id, active: "false" });
      data = await catalogs.getCatalogs();
      assert.equal(model.validCatalogValue(data, "tipos-maquina", created.value), false);
      assert.equal(model.validCatalogValue(data, "tipos-maquina", created.value, created.value), true);
      assert.equal(model.catalogOptions(data, "tipos-maquina").some(item => item.id === created.id), false);
      assert.equal(model.catalogOptions(data, "tipos-maquina", created.value).find(item => item.id === created.id).name, "Envasadora automática");
    });
    await t.test("Las altas persisten y las escrituras simultáneas no se pierden", async () => {
      const names = ["Mayorista", "Institución", "Restaurante"];
      await Promise.all(names.map(name => save("tipos-cliente", name)));
      const saved = JSON.parse(await fs.readFile("data/catalogs.json", "utf8"));
      assert.ok(names.every(name => saved["tipos-cliente"].some(item => item.name === name)));
      assert.equal(new Set(saved["tipos-cliente"].map(item => item.id)).size, saved["tipos-cliente"].length);
      await assert.rejects(save("tipos-cliente", "  MÁYORISTA  "), /Ya existe/);
      await assert.rejects(save("tipos-cliente", " "), /Completá/);
      await assert.rejects(save("../../users", "Otro"), /no existe/);
      await assert.rejects(save("tipos-cliente", "Otro", { id: "no-existe" }), /ya no existe/);
    });
    await t.test("Nuevos tipos de cliente, documento e IVA se guardan desde Ventas", async () => {
      await save("tipos-documento", "Identificación externa");
      await save("tipos-iva", "Condición de prueba");
      await sales.saveSalesClient({ ...salesModel.SAMPLE_CLIENTS[0], type: "Mayorista", name: "Cliente de prueba", documentType: "Identificación externa", ivaType: "Condición de prueba" }, undefined, "Administrador");
      client = (await sales.getSalesData()).clients.find(item => item.name === "Cliente de prueba");
      assert.equal(client.type, "Mayorista");
      assert.equal(client.documentType, "Identificación externa");
      assert.equal(client.ivaType, "Condición de prueba");
      await assert.rejects(sales.saveSalesClient({ ...client, type: "Inventado" }, undefined, "Administrador"), /Revisá/);
    });
    await t.test("Editar el nombre y desactivar mantiene referencias históricas sin ofrecerlas para nuevas altas", async () => {
      const original = (await catalogs.getCatalogs())["tipos-cliente"].find(item => item.value === "Mayorista");
      await save("tipos-cliente", "Mayoristas regionales", { id: original.id, active: "false" });
      const data = await catalogs.getCatalogs();
      const updated = data["tipos-cliente"].find(item => item.id === original.id);
      assert.equal(updated.value, "Mayorista");
      assert.equal(updated.name, "Mayoristas regionales");
      assert.equal(model.catalogOptions(data, "tipos-cliente").some(item => item.id === original.id), false);
      assert.equal(model.catalogOptions(data, "tipos-cliente", client.type).some(item => item.id === original.id), true);
      await sales.saveSalesClient({ ...client, notes: "Conserva su tipo" }, client.id, "Administrador");
      await assert.rejects(sales.saveSalesClient({ ...client, name: "Nuevo inactivo" }, undefined, "Administrador"), /Revisá/);
      assert.equal((await sales.getSalesData()).clients.find(item => item.id === client.id).type, "Mayorista");
    });
    await t.test("Nuevas modalidades de envío requieren dirección y los retiros no", async () => {
      delivery = await save("modalidades-entrega", "Mensajería", { behavior: "shipping" });
      const pickup = await save("modalidades-entrega", "Retiro en depósito", { behavior: "pickup" });
      const order = { ...salesModel.SAMPLE_ORDERS[1], clientId: client.id, fulfillment: delivery.value, deliveryAddressType: "custom", customDeliveryAddress: "Dirección de entrega", status: "Pendiente" };
      const shipping = await sales.saveSalesOrder(order);
      assert.equal(shipping.fulfillment, "Mensajería");
      assert.equal(shipping.deliveryAddress, "Dirección de entrega");
      await assert.rejects(sales.saveSalesOrder({ ...order, customDeliveryAddress: "" }), /dirección/);
      const collected = await sales.saveSalesOrder({ ...order, fulfillment: pickup.value, customDeliveryAddress: "" });
      assert.equal(collected.deliveryAddress, "Retiro en depósito");
      await assert.rejects(save("modalidades-entrega", delivery.name, { id: delivery.id, behavior: "pickup" }), /comportamiento/);
    });
    await t.test("Nuevos medios de pago se usan en recibos y se rechazan si están inactivos", async () => {
      payment = await save("medios-pago", "Billetera virtual");
      const receipt = { clientId: client.id, date: "2026-10-22", status: "Borrador", invoices: [], payments: [{ method: payment.value, amount: 100, reference: "operación" }], observations: "" };
      await billing.saveSalesReceipt(receipt);
      assert.equal((await sales.getSalesData()).receipts.find(item => item.clientId === client.id).payments[0].method, payment.value);
      await save("medios-pago", payment.name, { id: payment.id, active: "false" });
      await assert.rejects(billing.saveSalesReceipt(receipt), /método de pago activo/);
    });
    await t.test("Domicilios: relaciones, duplicados por localidad y bajas dependientes", async () => {
      const province = await save("provincias", "Provincia de prueba");
      const locality = await save("localidades", "Localidad de prueba", { parentId: province.id });
      const street = await save("calles", "Calle de prueba", { parentId: locality.id });
      const address = { id: "new-address", label: "Depósito", street: street.name, streetNumber: "10", floor: "", apartment: "", locality: locality.name, province: province.name };
      await sales.saveSalesClient({ ...client, type: "Particular", addresses: [address] }, client.id, "Administrador");
      const saved = (await sales.getSalesData()).clients.find(item => item.id === client.id);
      assert.equal(saved.addresses[0].street, "Calle de prueba");
      await assert.rejects(save("localidades", "Sin provincia", { parentId: "no-existe" }), /superior activo/);
      await assert.rejects(save("provincias", province.name, { id: province.id, active: "false" }), /dependen/);
      await save("calles", street.name, { id: street.id, parentId: locality.id, active: "false" });
      await sales.saveSalesClient({ ...saved, notes: "Dirección conservada" }, client.id, "Administrador");
      await assert.rejects(sales.saveSalesClient({ ...saved, name: "Otra dirección inactiva" }, undefined, "Administrador"), /catálogo/);
    });
    await t.test("Cada catálogo mantiene al menos una opción activa", async () => {
      const entries = (await catalogs.getCatalogs())["tipos-mantenimiento"];
      await save("tipos-mantenimiento", entries[0].name, { id: entries[0].id, active: "false" });
      await assert.rejects(save("tipos-mantenimiento", entries[1].name, { id: entries[1].id, active: "false" }), /al menos/);
    });
    await t.test("Las rutas verifican permisos del administrador tanto al leer como al escribir", async () => {
      for (const role of ["Ventas", "Cliente", "Administrador"]) {
        const user = { id: `test-${role}`, name: role, email: `${role}@example.test`, role, passwordHash: "unused" };
        await db.saveUser(user);
        const login = await session.createUserSession(user.id, "/");
        const cookie = login.headers.get("Set-Cookie").split(";")[0];
        const request = method => new Request("http://localhost/administracion/catalogos/medios-pago", { method, headers: { Cookie: cookie }, ...(method === "POST" ? { body: form(`Pago de ${role}`) } : {}) });
        if (role === "Administrador") {
          const loaded = await route.loader({ request: request("GET"), params: { catalogo: "medios-pago" } });
          assert.equal(loaded.definition.key, "medios-pago");
          assert.equal((await route.action({ request: request("POST"), params: { catalogo: "medios-pago" } })).success, true);
          await assert.rejects(route.loader({ request: request("GET"), params: { catalogo: "desconocido" } }), error => error instanceof Response && error.status === 404);
        } else {
          for (const [handler, method] of [[route.loader, "GET"], [route.action, "POST"]]) await assert.rejects(handler({ request: request(method), params: { catalogo: "medios-pago" } }), error => error instanceof Response && error.status === 403);
        }
      }
    });
    await t.test("Las pantallas comparten nuevos tipos, unidades, marcas y cargos", async () => {
      const additions = [["unidades", "caja"], ["tipos-producto", "Pasta especial"], ["tipos-materia-prima", "Conservas"], ["marcas", "Marca de prueba"], ["cargos", "Supervisor"], ["tipos-mantenimiento", "Predictivo"]];
      const saved = new Map();
      for (const [key, name] of additions) saved.set(key, await save(key, name));
      const data = await catalogs.getCatalogs();
      const provider = await server.ssrLoadModule("/app/components/CatalogProvider.tsx");
      const options = renderToStaticMarkup(createElement(provider.CatalogContext.Provider, { value: data }, createElement("select", null, createElement(provider.CatalogOptions, { catalog: "cargos" }))));
      assert.match(options, /Supervisor/);
      assert.doesNotMatch(options, /Mayoristas/);
      function ProductionProbe() {
        const current = provider.useProductionCatalogs();
        return createElement("p", null, [current.getUnidad(Number(saved.get("unidades").id)), current.getTipoProducto(Number(saved.get("tipos-producto").id)), current.getTipoMateriaPrima(Number(saved.get("tipos-materia-prima").id)), current.getMarca(Number(saved.get("marcas").id))].join(" / "));
      }
      const rendered = renderToStaticMarkup(createElement(provider.CatalogContext.Provider, { value: data }, createElement(ProductionProbe)));
      assert.match(rendered, /caja \/ Pasta especial \/ Conservas \/ Marca de prueba/);
    });
    await t.test("La tienda usa modalidades nuevas, permite retiro sin domicilio y rechaza opciones inactivas", async () => {
      const checkout = await server.ssrLoadModule("/app/routes/compras/cliente-carrito.tsx");
      const pickup = await save("modalidades-entrega", "Retiro de prueba", { behavior: "pickup" });
      const user = { id: "checkout-user", name: "Cliente", email: "checkout@example.test", passwordHash: "unused", role: "Cliente", cart: [{ productId: "p-1", quantity: 1 }] };
      await db.saveUser(user);
      const login = await session.createUserSession(user.id, "/");
      const cookie = login.headers.get("Set-Cookie").split(";")[0];
      const request = value => new Request("http://localhost/compras/carrito", { method: "POST", headers: { Cookie: cookie }, body: new URLSearchParams({ intent: "checkout", fulfillment: value }) });
      const result = await checkout.action({ request: request(pickup.value) });
      assert.equal(result.success, true);
      const stored = (await db.getUsers()).find(item => item.id === user.id);
      assert.equal(stored.customerOrders[0].fulfillment, pickup.value);
      assert.equal(stored.customerOrders[0].deliveryAddress, pickup.value);
      assert.equal(stored.customerOrders[0].deliveryAddressId, undefined);
      await db.mutateUser(user.id, current => { current.cart = [{ productId: "p-1", quantity: 1 }]; });
      const noAddress = await checkout.action({ request: request("Mensajería") });
      assert.match(noAddress.error, /dirección guardada/);
      await save("modalidades-entrega", pickup.name, { id: pickup.id, behavior: "pickup", active: "false" });
      assert.match((await checkout.action({ request: request(pickup.value) })).error, /activa/);
      assert.equal((await db.getUsers()).find(item => item.id === user.id).cart.length, 1);
    });
    await t.test("El alta desde modal devuelve la opción y verifica permisos, duplicados y creación exclusiva", async () => {
      const inline = await server.ssrLoadModule("/app/routes/catalogos-crear.tsx");
      for (const role of ["Administrador", "Ventas", "Cliente"]) {
        const login = await session.createUserSession(`test-${role}`, "/");
        const cookie = login.headers.get("Set-Cookie").split(";")[0];
        const run = (fields, catalogo = "tipos-cliente", materials = []) => {
          const body = new URLSearchParams({ intent: "create", name: "Cliente creado desde modal", description: "Alta contextual", ...fields });
          for (const id of materials) body.append("materiasPrimas", id);
          const request = new Request(`http://localhost/catalogos/${catalogo}/crear`, { method: "POST", headers: { Cookie: cookie }, body });
          return inline.action({ request, params: { catalogo } });
        };
        if (role !== "Administrador") {
          await assert.rejects(run(), error => error instanceof Response && error.status === 403);
          continue;
        }
        const result = await run();
        assert.equal(result.init.status, 201);
        assert.equal(result.data.entry.value, "Cliente creado desde modal");
        assert.equal(result.data.entry.active, true);
        assert.equal((await catalogs.getCatalogs())["tipos-cliente"].find(item => item.id === result.data.entry.id).description, "Alta contextual");
        const duplicate = await run();
        assert.equal(duplicate.init.status, 400);
        assert.match(duplicate.data.error, /Ya existe/);
        const attemptedEdit = await run({ id: result.data.entry.id, name: "Nombre alterado" });
        assert.equal(attemptedEdit.init.status, 400);
        assert.equal((await catalogs.getCatalogs())["tipos-cliente"].find(item => item.id === result.data.entry.id).name, "Cliente creado desde modal");
        const brand = await run({ name: "Marca creada desde modal", active: "false" }, "marcas", ["1", "2"]);
        assert.equal(brand.init.status, 201);
        assert.equal(brand.data.entry.active, false);
        assert.deepEqual(brand.data.entry.materiasPrimas, [1, 2]);
        const updated = await catalogs.getCatalogs();
        assert.deepEqual(updated.marcas.find(item => item.id === brand.data.entry.id), brand.data.entry);
        assert.ok(!model.catalogOptions(updated, "marcas").some(item => item.id === brand.data.entry.id));
      }
    });
    await t.test("Producción crea sus catálogos desde el modal sin acceder a la gestión general", async () => {
      await db.saveUser({ id: "test-produccion-inline", name: "Producción", email: "produccion-inline@example.test", role: "Producción", passwordHash: "unused" });
      const login = await session.createUserSession("test-produccion-inline", "/");
      const cookie = login.headers.get("Set-Cookie").split(";")[0];
      const inline = await server.ssrLoadModule("/app/routes/catalogos-crear.tsx");
      const run = (catalogo, extra = {}) => inline.action({ request: new Request(`http://localhost/catalogos/${catalogo}/crear`, { method: "POST", headers: { Cookie: cookie }, body: new URLSearchParams({ intent: "create", name: `Alta de producción ${catalogo}`, ...extra }) }), params: { catalogo } });
      for (const key of ["unidades", "tipos-producto", "subtipos-producto", "tipos-materia-prima", "marcas"]) {
        assert.equal(model.canCreateCatalog("Producción", key), true);
        const result = await run(key, key === "subtipos-producto" ? { parentId: "2" } : {});
        assert.equal(result.init.status, 201);
        assert.ok((await catalogs.getCatalogs())[key].some(entry => entry.id === result.data.entry.id));
        assert.equal((await run(key, { id: result.data.entry.id })).init.status, 400);
      }
      for (const key of ["cargos", "medios-pago", "tipos-maquina", "tipos-cliente"]) {
        assert.equal(model.canCreateCatalog("Producción", key), false);
        await assert.rejects(run(key), error => error instanceof Response && error.status === 403);
      }
      await assert.rejects(route.loader({ request: new Request("http://localhost/administracion/catalogos/unidades", { headers: { Cookie: cookie } }), params: { catalogo: "unidades" } }), error => error instanceof Response && error.status === 403);
      const { InlineCatalogProvider, CatalogField } = await server.ssrLoadModule("/app/components/InlineCatalog.tsx");
      const current = await catalogs.getCatalogs();
      const creatableCatalogs = model.CATALOG_DEFINITIONS.filter(item => model.canCreateCatalog("Producción", item.key)).map(item => item.key);
      const markup = renderToStaticMarkup(createElement(InlineCatalogProvider, { catalogs: current, canCreate: true, creatableCatalogs },
        ...["unidades", "tipos-producto", "subtipos-producto", "tipos-materia-prima", "marcas", "cargos"].map(catalog => createElement(CatalogField, { key: catalog, catalog }, createElement("select")))));
      assert.equal((markup.match(/<button/g) ?? []).length, 5);
      assert.match(markup, /Agregar marca/);
      assert.match(markup, /Agregar unidad de medida/);
      assert.doesNotMatch(markup, /Agregar cargo/);
      const { CatalogContext } = await server.ssrLoadModule("/app/components/CatalogProvider.tsx");
      const { CatalogEntryFields } = await server.ssrLoadModule("/app/components/CatalogEntryFields.tsx");
      const { InternalDataProvider } = await server.ssrLoadModule("/app/components/InternalDataProvider.tsx");
      const { getInternalData } = await server.ssrLoadModule("/app/data/internal.server.ts");
      const brandMarkup = renderToStaticMarkup(createElement(InternalDataProvider, { initial: getInternalData("Producción") },
        createElement(CatalogContext.Provider, { value: current }, createElement(CatalogEntryFields, { catalog: "marcas", initialMateriaPrima: 2 }))));
      assert.match(brandMarkup, /<input[^>]*name="materiasPrimas"[^>]*checked=""[^>]*value="2"/);
    });
    await t.test("Las marcas guardan sus materias primas y las recetas solo ofrecen las asociadas", async () => {
      const brandForm = (name, ids, extra = {}) => {
        const data = form(name, extra);
        for (const id of ids) data.append("materiasPrimas", id);
        return data;
      };
      let data = await catalogs.getCatalogs();
      assert.deepEqual(model.brandRawMaterials(data.marcas.find(item => item.id === "1")), [1, 3]);
      assert.deepEqual(model.brandsForRawMaterial(data, 1).map(item => item.id), ["1"]);
      const created = await catalogs.saveCatalogEntry("marcas", brandForm("Harinera Test", ["1", "2", "2"]));
      assert.deepEqual(created.materiasPrimas, [1, 2]);
      data = await catalogs.getCatalogs();
      assert.deepEqual(model.brandsForRawMaterial(data, 1).map(item => item.id).sort(), ["1", created.id].sort());
      assert.equal(model.brandsForRawMaterial(data, 5).some(item => item.id === created.id), false);
      await catalogs.saveCatalogEntry("marcas", brandForm("Harinera Test", ["5"], { id: created.id }));
      data = await catalogs.getCatalogs();
      assert.equal(model.brandsForRawMaterial(data, 1).some(item => item.id === created.id), false);
      assert.equal(model.brandsForRawMaterial(data, 1, created.id).some(item => item.id === created.id), true);
      await assert.rejects(catalogs.saveCatalogEntry("marcas", brandForm("Otra marca", ["abc"])), /no son válidas/);
      const legacy = { ...data.marcas.find(item => item.id === "3") };
      delete legacy.materiasPrimas;
      const stored = JSON.parse(await fs.readFile("data/catalogs.json", "utf8"));
      stored.marcas = stored.marcas.map(brand => brand.id === legacy.id ? legacy : brand);
      await fs.writeFile("data/catalogs.json", JSON.stringify(stored));
      const migrated = (await catalogs.getCatalogs()).marcas.find(brand => brand.id === legacy.id);
      assert.deepEqual(model.brandRawMaterials(migrated), [5, 6, 20, 21, 22, 23, 24]);
    });
    await t.test("Los subtipos de producto dependen de un tipo y cubren todos los productos", async () => {
      const production = { ...await server.ssrLoadModule("/app/data/produccion.ts"), ...await server.ssrLoadModule("/app/data/produccion-fixtures.server.ts") };
      let data = await catalogs.getCatalogs();
      const subtypes = data["subtipos-producto"];
      for (const product of production.PRODUCTOS_PRODUCCION) {
        const subtype = subtypes.find(item => item.id === String(product.idSubtipoProducto));
        assert.ok(subtype, product.nombre);
        assert.equal(subtype.parentId, String(product.idTipoProducto), product.nombre);
      }
      await assert.rejects(save("subtipos-producto", "Moñitos"), /registro superior/);
      const created = await save("subtipos-producto", "Moñitos", { parentId: "1" });
      assert.equal(created.parentId, "1");
      await assert.rejects(save("subtipos-producto", "moñitos", { parentId: "1" }), /Ya existe/);
      await save("subtipos-producto", "Moñitos", { parentId: "2" });
      await assert.rejects(save("tipos-producto", "Pasta seca", { id: "1", active: "false" }), /dependen/);
      const previous = catalogs.initialCatalogs();
      delete previous["subtipos-producto"];
      await fs.writeFile("data/catalogs.json", JSON.stringify(previous));
      data = await catalogs.getCatalogs();
      assert.equal(data["subtipos-producto"].length, production.SUBTIPOS_PRODUCTO.length);
    });
    await t.test("Un archivo inválido no se sobrescribe ni restablece silenciosamente", async () => {
      await fs.writeFile("data/catalogs.json", "contenido inválido");
      await assert.rejects(catalogs.getCatalogs(), /conservó/);
      await assert.rejects(save("medios-pago", "Otro"), /conservó/);
      assert.equal(await fs.readFile("data/catalogs.json", "utf8"), "contenido inválido");
    });
  } finally {
    process.chdir(originalCwd);
    await server.close();
    // sandbox is created by this test under the OS temporary directory.
    assert.ok(path.resolve(sandbox).startsWith(path.resolve(os.tmpdir()) + path.sep));
    await fs.rm(sandbox, { recursive: true, force: true });
  }
});
