import crypto from "node:crypto";
import { mutateSalesData } from "./sales.server";
import { cashSummary, openCash, type CashActor, type CashSession } from "./cash";
import { money } from "./billing";

function amount(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!/^\d{1,10}(?:\.\d{1,2})?$/.test(text)) throw new Error("Ingresá un importe válido, con hasta dos decimales.");
  return money(Number(text));
}
function text(value: FormDataEntryValue | null, max: number) {
  if (typeof value !== "string" || value.trim().length > max) throw new Error("Revisá el texto ingresado.");
  return value.trim();
}
export async function updateCash(form: FormData, actor: CashActor) {
  return mutateSalesData(async data => {
    const intent = form.get("intent");
    if (intent === "open") {
      if (data.cashSessions.some(session => !session.closedAt)) throw new Error("Ya existe una caja abierta. Actualizá la página.");
      const session: CashSession = { id: crypto.randomUUID(), number: `CA-${String(data.cashSessions.length + 1).padStart(6, "0")}`, openedAt: new Date().toISOString(), openedBy: actor, opening: amount(form.get("opening")), movements: [] };
      data.cashSessions.unshift(session);
      return { message: "Caja abierta correctamente.", id: session.id };
    }
    const session = openCash(data.cashSessions);
    if (form.get("sessionId") !== session.id) throw new Error("La caja cambió. Actualizá la página.");
    if (intent === "movement") {
      const kind = form.get("kind");
      const value = amount(form.get("amount"));
      const concept = text(form.get("concept"), 300);
      if ((kind !== "Ingreso" && kind !== "Egreso") || value <= 0 || !concept) throw new Error("Completá el tipo, un importe positivo y el concepto.");
      if (kind === "Egreso" && value > cashSummary(session, data.receipts).expected) throw new Error("El egreso supera el efectivo disponible en caja.");
      session.movements.unshift({ id: crypto.randomUUID(), at: new Date().toISOString(), actor, kind, amount: value, concept });
      return { message: "Movimiento registrado.", id: session.id };
    }
    if (intent === "close") {
      const summary = cashSummary(session, data.receipts);
      const counted = amount(form.get("counted"));
      const notes = text(form.get("notes"), 2000);
      const difference = money(counted - summary.expected);
      if (difference !== 0 && !notes) throw new Error("Explicá la diferencia de caja en las observaciones.");
      if (form.get("confirm") !== "yes") throw new Error("Confirmá que revisaste el arqueo antes de cerrar.");
      // Detect concurrent receipts/movements before confirming a stale form.
      if (Number(form.get("expected")) !== summary.expected || form.get("revision") !== `${summary.receipts.length}:${session.movements.length}`) throw new Error("Los movimientos cambiaron durante el arqueo. Revisá los importes actualizados y confirmá de nuevo.");
      Object.assign(session, { closedAt: new Date().toISOString(), closedBy: actor, counted, difference, notes, snapshot: structuredClone(summary) });
      return { message: "Caja cerrada. El arqueo quedó guardado.", id: session.id };
    }
    throw new Error("Acción no válida.");
  });
}
