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
  const serverOptions = { configFile: false, root: project, resolve: { alias: { "~": path.join(project, "app") } }, server: { middlewareMode: true, ws: false }, appType: "custom", optimizeDeps: { noDiscovery: true, include: [] } };
  const server = await createServer(serverOptions);
  const previousSessionSecret = process.env.SESSION_SECRET;
  try {
    delete process.env.SESSION_SECRET;
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
    const profile = await server.ssrLoadModule("/app/routes/compras/cliente-perfil.tsx");
    const customerOrders = await server.ssrLoadModule("/app/routes/compras/cliente-pedidos.tsx");
    const sales = await server.ssrLoadModule("/app/data/sales.server.ts");
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
      cookie = cookieOf(await guest.updateGuestCart(request("/catalogo", cookie, { intent: "add-to-cart", productId: "p-1", quantity: "5" })));
      assert.equal((await cart.loader({ request: request("/carrito", cookie) })).cart[0].quantity, 7);
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
        const invalidAdd = await guest.updateGuestCart(request("/catalogo", cookie, { intent: "add-to-cart", productId: "p-1", quantity }));
        assert.equal(invalidAdd.init.status, 400);
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
    await t.test("Una sesión de desarrollo sigue válida al volver a cargar el servidor", async () => {
      const authenticatedCookie = cookieOf(await session.createUserSession("fixture", "/"));
      const pageRequest = () => request("/compras/perfil", authenticatedCookie);
      assert.equal((await session.getUser(pageRequest()))?.id, "fixture");

      const restartedServer = await createServer(serverOptions);
      try {
        const restartedSession = await restartedServer.ssrLoadModule("/app/utils/session.server.ts");
        assert.notEqual(restartedSession.sessionStorage, session.sessionStorage);
        assert.equal((await restartedSession.getUser(pageRequest()))?.id, "fixture");
        await restartedSession.logout(pageRequest());
        assert.equal(await session.getUser(pageRequest()), null);
      } finally {
        await restartedServer.close();
      }
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
    await t.test("El carrito guarda y nombra direcciones del perfil y las usa para el envío", async () => {
      await db.saveUser({ id: "cliente-envio", name: "Cliente de envíos", role: "Cliente", email: "envio@example.test", passwordHash: "unused", phone: "2392 123456", cart: [{ productId: "p-1", quantity: 2 }] });
      const customerCookie = cookieOf(await session.createUserSession("cliente-envio", "/"));
      const cartAction = fields => privateCart.action({ request: request("/compras/carrito", customerCookie, fields) });
      const loadProfile = async () => (await profile.loader({ request: request("/compras/perfil", customerCookie) })).profile;
      const addAddress = (addressLabel, streetNumber, street = "Calle 7") => cartAction({ intent: "add-delivery-address", addressLabel, streetNumber, street, province: "Buenos Aires", locality: "La Plata" });

      const first = await addAddress("Casa", "123");
      const original = await loadProfile();
      assert.equal(original.addresses[0].id, first.addressId);
      assert.equal(original.addresses[0].label, "Casa");
      assert.match((await addAddress("Otro nombre", "123")).error, /ya está guardada/);
      assert.match((await addAddress("Oficina", "456", "Calle inexistente")).error, /catálogo/);
      assert.match((await addAddress(" ", "456")).error, /Ingresá un nombre/);
      const [office, depot] = await Promise.all([addAddress("Oficina", "456"), addAddress("Depósito", "789")]);
      assert.ok(office.addressId && depot.addressId && office.addressId !== depot.addressId);
      let saved = (await loadProfile()).addresses;
      assert.deepEqual(saved[0], original.addresses[0]);
      assert.deepEqual(new Set(saved.slice(1).map(address => address.label)), new Set(["Oficina", "Depósito"]));

      const saveProfile = (snapshot, addresses) => profile.action({ request: request("/compras/perfil", customerCookie, {
        name: original.name, phone: original.phone, documentType: original.documentType, cuitCuil: original.cuitCuil,
        ivaType: original.ivaType, notes: original.notes, savedAddresses: JSON.stringify(snapshot), addresses: JSON.stringify(addresses),
      }) });
      assert.match((await saveProfile(original.addresses, original.addresses)).error, /cambiaron desde otra pantalla/);
      assert.equal((await cartAction({ intent: "rename-delivery-address", addressId: first.addressId, addressLabel: "  Mi casa  " })).addressId, first.addressId);
      saved = (await loadProfile()).addresses;
      assert.equal(saved[0].label, "Mi casa");
      assert.equal((await saveProfile(saved, saved.map(address => address.id === office.addressId ? { ...address, label: "Trabajo" } : address))).success, true);

      const checkout = await privateCart.loader({ request: request("/compras/carrito", customerCookie) });
      assert.equal(checkout.fixedAddressId, first.addressId);
      assert.equal(checkout.addresses.find(address => address.id === office.addressId).label, "Trabajo");
      assert.equal(checkout.cart[0].quantity, 2);
      assert.equal((await cartAction({ intent: "checkout", fulfillment: "Envío", deliveryAddressId: office.addressId })).success, true);
      const stored = await db.getUserById("cliente-envio");
      assert.equal(stored.customerOrders[0].deliveryAddressId, office.addressId);
      assert.match(stored.customerOrders[0].deliveryAddress, /^Calle 7 456/);
      assert.equal(stored.address, "Calle 7 123");
    });
    await t.test("Solo el cliente titular puede editar su pedido pendiente y los cambios llegan a Ventas", async () => {
      const order = {
        id: "pedido-editable", number: "PC-1", clientId: "customer-titular", kind: "Regular", fulfillment: "Envío",
        date: "2026-11-20", deliveryDate: "2026-11-22", deliveryAddress: "Calle 7 456, La Plata, Buenos Aires",
        deliveryAddressType: "client", deliveryAddressId: "original", observations: "",
        items: [{ id: "renglon-1", productId: "p-1", productName: "Tallarines", quantity: 2, unitPrice: 2000, subtotal: 4000 }],
        subtotal: 4000, discount: 100, total: 3900, status: "Pendiente",
      };
      await db.saveUser({ id: "titular", name: "Titular", role: "Cliente", email: "titular@example.test", passwordHash: "unused", customerOrders: [order] });
      await db.saveUser({ id: "otro", name: "Otro cliente", role: "Cliente", email: "otro@example.test", passwordHash: "unused" });
      const ownerCookie = cookieOf(await session.createUserSession("titular", "/"));
      const otherCookie = cookieOf(await session.createUserSession("otro", "/"));
      const url = `/compras/pedidos?pedido=${order.id}&vista=editar`;
      const initial = await customerOrders.loader({ request: request(url, ownerCookie) });
      assert.equal(initial.order.id, order.id);
      assert.ok(initial.version);
      await assert.rejects(() => customerOrders.loader({ request: request(url, otherCookie) }), error => error.status === 404);

      const edit = (cookie, overrides = {}) => customerOrders.action({ request: request(url, cookie, {
        intent: "edit-order", orderId: order.id, version: initial.version,
        fulfillment: "Envío", deliveryAddressId: "", observations: "Entregar por la tarde",
        items: JSON.stringify([{ id: order.items[0].id, quantity: 3, unitPrice: 1 }, { productId: "p-2", quantity: 1 }]), ...overrides,
      }) });
      assert.match((await edit(otherCookie)).error, /en tu cuenta/);
      assert.match((await edit(ownerCookie, { deliveryAddressId: "foreign-address" })).error, /dirección guardada/);
      assert.match((await edit(ownerCookie, { items: "[]" })).error, /al menos un producto/);
      const response = await edit(ownerCookie, { status: "Facturado", clientId: "customer-fixture" });
      assert.equal(response.status, 302);
      const saved = (await sales.getSalesData()).orders.find(item => item.id === order.id);
      assert.equal(saved.status, "Pendiente");
      assert.equal(saved.clientId, order.clientId);
      assert.equal(saved.deliveryAddress, order.deliveryAddress);
      assert.equal(saved.items[0].unitPrice, order.items[0].unitPrice);
      assert.deepEqual(saved.items.map(item => item.quantity), [3, 1]);
      assert.equal(saved.total, saved.items.reduce((total, item) => total + item.subtotal, 0) - order.discount);
      assert.equal(saved.observations, "Entregar por la tarde");
      assert.match((await edit(ownerCookie)).error, /cambió mientras lo editabas/);

      await sales.changeSalesOrderStatus(order.id, "En preparación");
      assert.equal((await customerOrders.loader({ request: request(url, ownerCookie) })).version, null);
      assert.match((await edit(ownerCookie, { version: sales.customerOrderVersion({ ...saved, status: "En preparación" }) })).error, /pedidos pendientes/);

      const event = { ...saved, id: "evento-en-sucursal", number: "EV-10", kind: "Evento", deliveryTime: "16:00" };
      await sales.mutateSalesData(async data => { data.orders.push(event); });
      const eventUrl = `/compras/pedidos?pedido=${event.id}&vista=editar`;
      const eventPage = await customerOrders.loader({ request: request(eventUrl, ownerCookie) });
      const eventResult = await edit(ownerCookie, { orderId: event.id, version: eventPage.version, fulfillment: "Retiro en local", observations: "Retiro confirmado", items: "[]" });
      assert.equal(eventResult.status, 302);
      const updatedEvent = (await sales.getSalesData()).orders.find(item => item.id === event.id);
      assert.equal(updatedEvent.fulfillment, "Retiro en local");
      assert.equal(updatedEvent.deliveryTime, "16:00");
      assert.deepEqual(updatedEvent.items, event.items);
      assert.equal(updatedEvent.total, event.total);
      await sales.mutateSalesData(async data => {
        data.invoices.push({ ...data.invoices[0], id: "factura-evento-editable", orderId: event.id, clientId: event.clientId, status: "Emitido", type: "Factura A" });
      });
      assert.equal((await customerOrders.loader({ request: request(eventUrl, ownerCookie) })).order.status, "Facturado");
      assert.match((await edit(ownerCookie, { orderId: event.id, version: sales.customerOrderVersion(updatedEvent) })).error, /pedidos pendientes/);
    });
  } finally {
    if (previousSessionSecret === undefined) delete process.env.SESSION_SECRET;
    else process.env.SESSION_SECRET = previousSessionSecret;
    process.chdir(originalCwd);
    await server.close();
    for (const [index, file] of files.entries()) assert.deepEqual(await readOptional(file), originals[index], "Los datos reales deben permanecer intactos");
    assert.ok(sandbox.startsWith(path.join(os.tmpdir(), "pastas-catalogo-publico-")));
    await fs.rm(sandbox, { recursive: true, force: true });
  }
});
