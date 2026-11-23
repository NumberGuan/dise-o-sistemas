import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

test("Recetas: cantidades por presentación y consumo en unidades de stock", async t => {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const server = await createServer({ configFile: false, root, resolve: { alias: { "~": path.join(root, "app") } }, server: { middlewareMode: true, hmr: false }, appType: "custom", optimizeDeps: { noDiscovery: true, include: [] } });
  try {
    const model = await server.ssrLoadModule("/app/data/produccion.ts");
    await t.test("Una docena de sorrentinos consume 200 g de harina y dos huevos", () => {
      const consumo = model.consumoDeReceta(4);
      assert.equal(consumo.find(m => m.idMateriaPrima === 2).cantidad, 0.2);
      assert.ok(Math.abs(consumo.find(m => m.idMateriaPrima === 4).cantidad - 2 / 12) < 0.001);
      assert.equal(model.consumoDeReceta(4, 3).find(m => m.idMateriaPrima === 2).cantidad, 0.6);
    });
    await t.test("Toda receta tiene un producto y cantidades positivas con unidades compatibles", () => {
      for (const receta of model.RECETAS) {
        assert.ok(model.PRODUCTOS_PRODUCCION.some(p => p.idReceta === receta.idReceta));
        for (const m of receta.materiasPrimas) {
          assert.ok(m.cantidadNecesaria > 0);
          assert.ok(model.unidadesCompatibles(model.getMateriaPrima(m.idMateriaPrima).idUnidad).includes(m.idUnidad));
        }
      }
    });
    await t.test("Convierte gramos y docenas y rechaza mezclar peso con volumen", () => {
      assert.equal(model.convertirUnidad(250, 2, 1), 0.25);
      assert.equal(model.convertirUnidad(2, 5, 4), 24);
      assert.equal(model.convertirUnidad(0.5, 3, 3), 0.5);
      assert.throws(() => model.convertirUnidad(100, 2, 3), /compatibles/);
    });
    await t.test("Los frascos de salsa de 250 g usan una cantidad razonable de ingredientes", () => {
      for (const p of model.PRODUCTOS_PRODUCCION.filter(p => p.idTipoProducto === 4)) {
        const total = model.getReceta(p.idReceta).materiasPrimas.reduce((sum, m) => sum + (m.idUnidad === 2 ? m.cantidadNecesaria : m.cantidadNecesaria * 1000), 0);
        assert.ok(total >= 240 && total <= 350, `${p.nombre}: ${total}`);
      }
    });
    await t.test("No guarda una receta sin producto ni reasigna el último producto de otra receta", () => {
      const receta = { ...model.RECETAS[0], idReceta: 999 };
      assert.throws(() => model.guardarRecetaConProducto(receta, null), /producto/i);
      assert.throws(() => model.guardarRecetaConProducto(receta, model.getProducto(4)), /otra receta/i);
      assert.ok(!model.RECETAS.some(r => r.idReceta === 999));
    });
    await t.test("Guarda receta y producto nuevo juntos", () => {
      const receta = { ...model.RECETAS[0], idReceta: 999 };
      const producto = { ...model.getProducto(1), idProducto: 999, idReceta: 999, nombre: "Pasta de prueba" };
      model.guardarRecetaConProducto(receta, producto);
      assert.equal(model.getProducto(999).idReceta, model.getReceta(999).idReceta);
      model.RECETAS.splice(model.RECETAS.findIndex(r => r.idReceta === 999), 1);
      model.PRODUCTOS_PRODUCCION.splice(model.PRODUCTOS_PRODUCCION.findIndex(p => p.idProducto === 999), 1);
    });
  } finally {
    await server.close();
  }
});
