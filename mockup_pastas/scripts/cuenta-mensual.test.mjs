import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

test("Descuento de comercios, cuenta mensual y cobros persistentes", async t => {
  const originalCwd = process.cwd();
  const project = fileURLToPath(new URL("../", import.meta.url));
  const realFiles = ["sales.json", "users.json"].map(name => path.join(project, "data", name));
  const readOptional = file => fs.readFile(file).catch(error => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  const originals = await Promise.all(realFiles.map(readOptional));
  const sandbox = await fs.mkdtemp(path.join(os.tmpdir(), "pastas-cuenta-mensual-"));
  const server = await createServer({ configFile: false, root: project, resolve: { alias: { "~": path.join(project, "app") } }, server: { middlewareMode: true }, appType: "custom", optimizeDeps: { noDiscovery: true, include: [] } });
  try {
    process.chdir(sandbox);
    assert.equal(process.cwd(), sandbox);
    assert.ok(!path.resolve("data/sales.json").startsWith(project));
    assert.ok(!path.resolve("data/users.json").startsWith(project));
    // Los módulos fijan sus rutas después de cambiar a la carpeta temporal.
    const model = await server.ssrLoadModule("/app/data/sales.ts");
    const billing = await server.ssrLoadModule("/app/data/billing.ts");
    const current = billing.currentSalesMonth();
    const previousDate = new Date(`${current}-01T12:00:00Z`);
    previousDate.setUTCMonth(previousDate.getUTCMonth() - 1);
    const previous = previousDate.toISOString().slice(0, 7);
    const client = { ...model.SAMPLE_CLIENTS[1], balance: 999999 };
    const item = { id: "line", productId: "p-1", productName: "Producto", quantity: 5, unitPrice: 2000, subtotal: 10000 };
    const order = (id, month, status = "Pendiente") => ({ ...model.SAMPLE_ORDERS[1], id, number: id, clientId: client.id, date: `${month}-10`, items: [{ ...item }], subtotal: 10000, discount: 0, total: 10000, status });
    await fs.mkdir("data");
    await fs.writeFile("data/users.json", "[]");
    await fs.writeFile("data/sales.json", JSON.stringify({ clients: [client], orders: [order("first", previous), order("second", previous), order("current", current), order("cancelled", previous, "Cancelado")], invoices: [], receipts: [] }));
    const sales = await server.ssrLoadModule("/app/data/sales.server.ts");
    const service = await server.ssrLoadModule("/app/data/billing.server.ts");
    const invoiceInput = id => ({ orderId: id, clientId: client.id, type: "Factura A", date: `${current}-01`, dueDate: `${current}-28`, status: "Emitido", observations: "", discount: 0, total: 1 });
    const receiptInput = (invoices, extras = {}) => ({ clientId: client.id, date: `${current}-10`, status: "Registrado", observations: "", invoices: invoices.map(invoice => ({ invoiceId: invoice.id, amountApplied: invoice.total })), payments: [{ method: "Transferencia", amount: billing.money(invoices.reduce((sum, invoice) => sum + invoice.total, 0)), reference: "Prueba" }], ...extras });
    await t.test("Los medios de pago se acumulan y se aplican sin superar los saldos de las facturas", () => {
      const pending = [{ id: "first", number: "FC-1", balance: 100.10 }, { id: "second", number: "FC-2", balance: 50.20 }];
      const detail = (invoiceId, invoiceNumber, amountApplied) => ({ invoiceId, invoiceNumber, amountApplied });
      assert.deepEqual(billing.allocateReceiptPayment(pending, 0), []);
      assert.deepEqual(billing.allocateReceiptPayment(pending, 40), [detail("first", "FC-1", 40)]);
      assert.deepEqual(billing.allocateReceiptPayment(pending, 40 + 30), [detail("first", "FC-1", 70)]);
      assert.deepEqual(billing.allocateReceiptPayment(pending, 40 + 80), [detail("first", "FC-1", 100.10), detail("second", "FC-2", 19.90)]);
      assert.deepEqual(billing.allocateReceiptPayment(pending, 200), [detail("first", "FC-1", 100.10), detail("second", "FC-2", 50.20)]);
      assert.deepEqual(billing.allocateReceiptPayment(pending, 0.1 + 0.2), [detail("first", "FC-1", 0.30)]);
    });
    await t.test("El 15% se aplica por producto, antes del IVA y sin acumular descuentos", () => {
      const amounts = billing.invoiceAmounts([item], "Comercio", 500);
      assert.equal(amounts.items[0].discount, 1500);
      assert.equal(amounts.items[0].netSubtotal, 8500);
      assert.equal(amounts.discount, 1500);
      assert.equal(amounts.tax, 1785);
      assert.equal(amounts.total, 10285);
      assert.equal(billing.invoiceAmounts([item], "Particular").total, 12100);
      assert.equal(billing.invoiceAmounts([item], "Distribuidor", 500).discount, 500);
      assert.equal(billing.nextSalesMonth("2026-12"), "2027-01");
    });
    await t.test("El saldo deriva de pedidos no cancelados y se agrupa por mes", async () => {
      const data = await sales.getSalesData();
      assert.equal(data.clients[0].balance, 30855);
      const months = billing.getClientMonthlyAccount(data.clients[0], data.orders, data.invoices, data.receipts);
      assert.equal(months.find(month => month.month === previous).balance, 20570);
      assert.equal(months.find(month => month.month === previous).orderCount, 2);
      assert.equal(months.find(month => month.month === current).balance, 10285);
    });
    await t.test("El servidor recalcula la factura y bloquea duplicados y meses sin facturar", async () => {
      await service.saveSalesInvoice(invoiceInput("first"));
      let data = await sales.getSalesData();
      assert.equal(data.invoices[0].discount, 1500);
      assert.equal(data.invoices[0].total, 10285);
      assert.equal(data.orders.find(order => order.id === "first").status, "Facturado");
      await assert.rejects(() => service.saveSalesInvoice(invoiceInput("first")));
      await assert.rejects(() => service.saveSalesReceipt(receiptInput(data.invoices, { accountMonth: previous })));
      await service.saveSalesInvoice(invoiceInput("second"));
      data = await sales.getSalesData();
      await assert.rejects(() => service.saveSalesReceipt(receiptInput(data.invoices, { accountMonth: previous, date: `${previous}-28` })));
      assert.equal(data.clients[0].balance, 30855);
    });
    await t.test("Un solo recibo salda todas las facturas del mes y persiste al releer", async () => {
      const data = await sales.getSalesData();
      await service.saveSalesReceipt(receiptInput(data.invoices, { accountMonth: previous }));
      const saved = await sales.getSalesData();
      assert.equal(saved.clients[0].balance, 10285);
      assert.equal(saved.receipts[0].invoices.length, 2);
      assert.equal(saved.receipts[0].total, 20570);
      assert.equal(JSON.parse(await fs.readFile("data/sales.json", "utf8")).receipts[0].accountMonth, previous);
      await assert.rejects(() => service.saveSalesReceipt(receiptInput(data.invoices, { accountMonth: previous })));
      await assert.rejects(() => service.saveSalesInvoice({ ...data.invoices[0], status: "Anulado" }, data.invoices[0].id));
    });
    await t.test("Anular el recibo restablece la deuda y solo un cobro concurrente puede saldarla", async () => {
      let data = await sales.getSalesData();
      await service.saveSalesReceipt({ status: "Anulado" }, data.receipts[0].id);
      data = await sales.getSalesData();
      assert.equal(data.clients[0].balance, 30855);
      const invoice = data.invoices[0];
      const results = await Promise.allSettled([service.saveSalesReceipt(receiptInput([invoice])), service.saveSalesReceipt(receiptInput([invoice]))]);
      assert.equal(results.filter(result => result.status === "fulfilled").length, 1);
      assert.equal((await sales.getSalesData()).clients[0].balance, 20570);
    });
    await t.test("No se puede imponer un saldo manual al modificar el cliente", async () => {
      const data = await sales.getSalesData();
      await sales.saveSalesClient({ ...data.clients[0], balance: 999999 }, client.id, "Ventas");
      assert.equal((await sales.getSalesData()).clients[0].balance, 20570);
    });
    await t.test("Los borradores no cobran y un pago parcial solo resta el importe registrado", async () => {
      let data = await sales.getSalesData();
      const invoice = data.invoices.find(invoice => model.getInvoicePaymentSummary(invoice, undefined, data.receipts).balance > 0);
      const payments = [{ method: "Efectivo", amount: 600 }, { method: "Transferencia", amount: 400 }];
      const applied = billing.allocateReceiptPayment([{ id: invoice.id, number: invoice.number, balance: invoice.total }], payments.reduce((sum, payment) => sum + payment.amount, 0));
      const partial = receiptInput([invoice], { status: "Borrador", invoices: applied, payments });
      await service.saveSalesReceipt(partial);
      data = await sales.getSalesData();
      assert.equal(data.clients[0].balance, 20570);
      const draft = data.receipts.find(receipt => receipt.status === "Borrador");
      await service.saveSalesReceipt({ ...draft, status: "Registrado" }, draft.id);
      data = await sales.getSalesData();
      assert.equal(data.clients[0].balance, 19570);
      assert.equal(model.getInvoicePaymentSummary(invoice, undefined, data.receipts).balance, invoice.total - 600 - 400);
      await assert.rejects(() => service.saveSalesReceipt(receiptInput([invoice])));
      await service.saveSalesReceipt({ status: "Anulado" }, draft.id);
      assert.equal((await sales.getSalesData()).clients[0].balance, 20570);
    });
  } finally {
    process.chdir(originalCwd);
    await server.close();
    for (const [index, file] of realFiles.entries()) assert.deepEqual(await readOptional(file), originals[index], "Los datos reales deben quedar intactos");
    assert.ok(sandbox.startsWith(path.join(os.tmpdir(), "pastas-cuenta-mensual-")));
    await fs.rm(sandbox, { recursive: true, force: true });
  }
});
