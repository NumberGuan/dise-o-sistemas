import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

test("Catálogo público, carrito de visitante y acceso para comprar", async t => {
  const originalCwd = process.cwd();
  const project = fileURLToPath(new URL("../", import.meta.url));
  const files = ["users.json", "sales.json"].map(name => path.join(project, "data", name));
  const readOptional = file => fs.readFile(file).catch(error => { if (error.code === "ENOENT") return null; throw error; });
  const originals = await Promise.all(files.map(readOptional));
  const sandbox = await fs.mkdtemp(path.join(os.tmpdir(), "pastas-catalogo-publico-"));
  const server = await createServer({ configFile: false, root: project, resolve: { alias: { "~": path.join(project, "app") } }, server: { middlewareMode: true }, appType: "custom", optimizeDeps: { noDiscovery: true, include: [] } });
  try {
    process.chdir(sandbox);
    assert.ok(!path.resolve("data/users.json").startsWith(project));
    await fs.mkdir("data");
    await fs.writeFile("data/users.json", "[]");
    const db = await server.ssrLoadModule("/app/utils/db.server.ts");
    const session = await server.ssrLoadModule("/app/utils/session.server.ts");
    const guest = await server.ssrLoadModule("/app/data/guest-cart.server.ts");
    const catalog = await server.ssrLoadModule("/app/routes/catalogo-publico.tsx");
    const cart = await server.ssrLoadModule("/app/routes/carrito-publico.tsx");
    const shop = await server.ssrLoadModule("/app/routes/tienda-publica.tsx");
    const privateCart = await server.ssrLoadModule("/app/routes/compras/cliente-carrito.tsx");
    const login = await server.ssrLoadModule("/app/routes/auth/login.tsx");
    const register = await server.ssrLoadModule("/app/routes/auth/register.tsx");
    const { localRedirect } = await server.ssrLoadModule("/app/utils/redirect.ts");
    const request = (url, cookie, fields) => new Request(`http://localhost${url}`, { ...(fields ? { method: "POST", body: new URLSearchParams(fields) } : {}), headers: cookie ? { Cookie: cookie } : {} });
    const cookieOf = result => (result instanceof Response ? result.headers.get("Set-Cookie") : result.init.headers["Set-Cookie"]).split(";")[0];
    let cookie;
    await t.test("El regreso después de ingresar o registrarse solo admite destinos locales", () => {
      for (const destination of ["https://example.test", "//example.test", "/\\example.test", "/\n/example.test"]) assert.equal(localRedirect(destination), "/");
      assert.equal(localRedirect("/compras/carrito"), "/compras/carrito");
    });
    await t.test("Se puede consultar y filtrar sin cuenta", async () => {
      const data = await catalog.loader({ request: request("/catalogo") });
      assert.equal(data.products.length, 20);
      assert.equal(new Set(data.products.map(product => product.id)).size, 20);
      for (const product of data.products) assert.match(product.name, / x (500|250)g$/);
      const pastas = await catalog.loader({ request: request("/catalogo?category=Pastas") });
      assert.equal(pastas.products.length, 13);
      assert.ok(pastas.products.every(product => product.category === "Pastas"));
      const sauces = await catalog.loader({ request: request("/catalogo?category=Salsas") });
      assert.equal(sauces.products.length, 7);
      assert.ok(sauces.products.every(product => product.category === "Salsas"));
      const combined = await catalog.loader({ request: request("/catalogo?category=Salsas&q=quesos&availability=available&sort=price-asc") });
      assert.deepEqual(combined.products.map(product => product.id), ["s-4"]);
      const excluded = await catalog.loader({ request: request("/catalogo?category=Pastas&q=fileto") });
      assert.equal(excluded.products.length, 0);
      const invalidCategory = await catalog.loader({ request: request("/catalogo?category=desconocida") });
      assert.equal(invalidCategory.products.length, 20);
      assert.deepEqual(data.favorites, []);
      assert.deepEqual(data.cart, []);
      const filtered = await catalog.loader({ request: request("/catalogo?q=noquis") });
      assert.equal(filtered.products[0].id, "p-4");
      assert.deepEqual(await db.getUsers(), []);
    });
    await t.test("El carrito conserva cantidades, usa precios del catálogo y permite quitar productos", async () => {
      cookie = cookieOf(await guest.updateGuestCart(request("/catalogo", undefined, { intent: "add-to-cart", productId: "p-1", price: "0" })));
      cookie = cookieOf(await guest.updateGuestCart(request("/catalogo", cookie, { intent: "add-to-cart", productId: "p-1" })));
      let data = await cart.loader({ request: request("/carrito", cookie) });
      assert.equal(data.cart[0].quantity, 2);
      assert.equal(data.total, 4000);
      cookie = cookieOf(await guest.updateGuestCart(request("/carrito", cookie, { intent: "update-quantity", productId: "p-1", quantity: "3" })));
      assert.equal((await cart.loader({ request: request("/carrito", cookie) })).total, 6000);
      cookie = cookieOf(await guest.updateGuestCart(request("/carrito", cookie, { intent: "remove-item", productId: "p-1" })));
      assert.deepEqual(await guest.getGuestCart(request("/carrito", cookie)), []);
      cookie = cookieOf(await guest.updateGuestCart(request("/catalogo", cookie, { intent: "add-to-cart", productId: "s-1" })));
      const sauceCart = await cart.loader({ request: request("/carrito", cookie) });
      assert.equal(sauceCart.total, 1800);
      assert.equal(sauceCart.cart[0].product.name, "Salsa fileto x 250g");
      cookie = cookieOf(await guest.updateGuestCart(request("/carrito", cookie, { intent: "remove-item", productId: "s-1" })));
      for (const quantity of ["-1", "1.5", "1001", "", "NaN"]) {
        const invalid = await guest.updateGuestCart(request("/carrito", cookie, { intent: "update-quantity", productId: "p-1", quantity }));
        assert.equal(invalid.init.status, 400);
      }
    });
    await t.test("Un visitante no puede guardar favoritos ni confirmar una compra", async () => {
      const favorite = await guest.updateGuestCart(request("/catalogo", cookie, { intent: "toggle-favorite", productId: "p-1" }));
      assert.equal(favorite.init.status, 400);
      const checkout = await guest.updateGuestCart(request("/carrito", cookie, { intent: "checkout" }));
      assert.equal(checkout.status, 302);
      assert.match(checkout.headers.get("Location"), /^\/register/);
      await assert.rejects(() => privateCart.action({ request: request("/compras/carrito", cookie, { intent: "checkout" }) }), response => response instanceof Response && response.status === 302 && response.headers.get("Location").startsWith("/login"));
      assert.deepEqual(await db.getUsers(), []);
    });
    await t.test("Ingresar combina ambos carritos y el siguiente acceso no duplica productos", async () => {
      await db.saveUser({ id: "fixture", name: "Cliente de prueba", email: "fixture@example.test", passwordHash: db.hashPassword("prueba123"), role: "Cliente", cart: [{ productId: "p-1", quantity: 3 }], favorites: ["p-4"] });
      cookie = cookieOf(await guest.updateGuestCart(request("/catalogo", cookie, { intent: "add-to-cart", productId: "p-1" })));
      const response = await login.action({ request: request("/login", cookie, { email: "fixture@example.test", password: "prueba123", redirectTo: "/compras/carrito" }) });
      assert.equal(response.headers.get("Location"), "/compras/carrito");
      const authenticatedCookie = cookieOf(response);
      const user = await session.getUser(request("/compras/carrito", authenticatedCookie));
      assert.equal(user.cart[0].quantity, 4);
      assert.deepEqual(user.favorites, ["p-4"]);
      assert.deepEqual(await guest.getGuestCart(request("/catalogo", authenticatedCookie)), []);
      await assert.rejects(() => shop.loader({ request: request("/carrito", authenticatedCookie) }), response => response instanceof Response && response.headers.get("Location") === "/compras/carrito");
      await session.createUserSession(user.id, "/", request("/login", authenticatedCookie));
      assert.equal((await db.getUserById(user.id)).cart[0].quantity, 4);
    });
    await t.test("Registrarse conserva el carrito y continúa en la pantalla de compra", async () => {
      const guestCookie = cookieOf(await guest.updateGuestCart(request("/catalogo", undefined, { intent: "add-to-cart", productId: "p-2" })));
      const response = await register.action({ request: request("/register", guestCookie, { name: "Nuevo cliente", email: "nuevo@example.test", password: "prueba123", redirectTo: "/compras/carrito" }) });
      assert.equal(response.headers.get("Location"), "/compras/carrito");
      const user = await session.getUser(request("/compras/carrito", cookieOf(response)));
      assert.equal(user.role, "Cliente");
      assert.deepEqual(user.cart, [{ productId: "p-2", quantity: 1 }]);
      assert.equal(user.customerOrders?.length ?? 0, 0);
    });
  } finally {
    process.chdir(originalCwd);
    await server.close();
    for (const [index, file] of files.entries()) assert.deepEqual(await readOptional(file), originals[index], "Los datos reales deben permanecer intactos");
    assert.ok(sandbox.startsWith(path.join(os.tmpdir(), "pastas-catalogo-publico-")));
    await fs.rm(sandbox, { recursive: true, force: true });
  }
});
