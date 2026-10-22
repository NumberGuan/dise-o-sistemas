import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

test("Domicilios tabulados compartidos", async t => {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const server = await createServer({ configFile: false, root, resolve: { alias: { "~": path.join(root, "app") } }, server: { middlewareMode: true }, appType: "custom", optimizeDeps: { noDiscovery: true, include: [] } });
  try {
    const catalog = await server.ssrLoadModule("/app/data/domicilios.ts");
    const sales = await server.ssrLoadModule("/app/data/sales.ts");
    const suppliers = await server.ssrLoadModule("/app/data/proveedores.ts");
    const address = { id: "casa", label: "Casa", province: "Buenos Aires", locality: "La Plata", street: "Calle 7", streetNumber: "123", floor: "", apartment: "" };

    await t.test("Las tablas tienen claves únicas y relaciones existentes", () => {
      for (const table of [catalog.PROVINCIAS, catalog.LOCALIDADES, catalog.CALLES]) assert.equal(new Set(table.map(row => row.id)).size, table.length);
      for (const row of catalog.LOCALIDADES) assert.ok(catalog.PROVINCIAS.some(province => province.id === row.provinciaId));
      for (const row of catalog.CALLES) assert.ok(catalog.LOCALIDADES.some(locality => locality.id === row.localidadId));
    });
    await t.test("Los domicilios iniciales pertenecen al catálogo", () => {
      for (const client of sales.SAMPLE_CLIENTS) assert.ok(catalog.isTabulatedAddress(client));
      for (const supplier of suppliers.getProveedores()) {
        const value = suppliers.getDomicilioPorId(supplier.idDomicilio);
        assert.ok(catalog.isTabulatedAddress({ province: value.provincia, locality: value.localidad, street: value.calle }));
        assert.ok(value.altura);
      }
    });
    await t.test("Rechaza combinaciones ajenas al catálogo y alturas vacías", () => {
      assert.equal(sales.validateClientAddresses([address])[0].street, "Calle 7");
      for (const change of [{ province: "Córdoba" }, { locality: "Morón" }, { street: "Calle inexistente" }, { streetNumber: " " }]) {
        assert.throws(() => sales.validateClientAddresses([{ ...address, ...change }]));
      }
    });
    await t.test("Conserva domicilios anteriores y exige catálogo al cambiar su ubicación", () => {
      const previous = { ...address, street: "Pasaje anterior", locality: "Localidad anterior", province: "Provincia anterior" };
      assert.equal(sales.validateClientAddresses([{ ...previous, floor: "2" }], [previous])[0].floor, "2");
      assert.throws(() => sales.validateClientAddresses([{ ...previous, street: "Otro pasaje" }], [previous]));
      assert.throws(() => sales.validateClientAddresses([previous]));
    });
    await t.test("Filtra calles por localidad dentro de su provincia", () => {
      assert.ok(catalog.addressOptions("Buenos Aires", "La Plata").calles.some(row => row.nombre === "Calle 7"));
      assert.equal(catalog.addressOptions("Córdoba", "La Plata").calles.length, 0);
      assert.equal(catalog.addressOptions("", "").calles.length, 0);
    });
    await t.test("Trenque Lauquen ofrece un catálogo amplio y Vi busca por prefijo", () => {
      const streets = catalog.addressOptions("Buenos Aires", "Trenque Lauquen").calles;
      assert.ok(streets.length >= 100);
      assert.deepEqual(catalog.searchStreets(streets, "Vi").map(street => street.nombre), ["Viani", "Vignau", "Villegas"]);
      assert.deepEqual(catalog.searchStreets(streets, "  vI  "), catalog.searchStreets(streets, "Vi"));
      assert.deepEqual(catalog.searchStreets(streets, "ig"), []);
      assert.deepEqual(catalog.searchStreets(streets, "calle inexistente"), []);
      assert.equal(catalog.searchStreets(streets, "").length, streets.length);
      assert.equal(catalog.addressOptions("Córdoba", "Trenque Lauquen").calles.length, 0);
    });
    await t.test("La búsqueda ignora tildes y devuelve el nombre original para guardar", () => {
      const streets = catalog.addressOptions("Buenos Aires", "Trenque Lauquen").calles;
      assert.deepEqual(catalog.searchStreets(streets, "saenz").map(street => street.nombre), ["Sáenz Peña"]);
      const selected = catalog.searchStreets(streets, "vign")[0];
      const value = { ...address, locality: "Trenque Lauquen", street: selected.nombre };
      assert.equal(sales.validateClientAddresses([value])[0].street, "Vignau");
      assert.throws(() => sales.validateClientAddresses([{ ...value, street: "Vi" }]));
    });
    await t.test("El guardado de proveedores valida el domicilio antes de modificar datos", () => {
      const supplier = suppliers.getProveedores()[0];
      const original = suppliers.getDomicilioPorId(supplier.idDomicilio);
      assert.throws(() => suppliers.updateProveedor(supplier.idPersona, supplier, { ...original, localidad: "Morón" }));
      assert.deepEqual(suppliers.getDomicilioPorId(supplier.idDomicilio), original);
    });
  } finally { await server.close(); }
});
