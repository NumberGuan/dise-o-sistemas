import type { Receipt } from "./sales";
import { money } from "./billing";

export type CashActor = { id: string; name: string };
export type CashMovement = { id: string; at: string; actor: CashActor; kind: "Ingreso" | "Egreso"; amount: number; concept: string };
export type CashSummary = {
  receipts: Receipt[];
  byMethod: { method: string; amount: number }[];
  collected: number; cashCollected: number; income: number; expense: number; expected: number;
};
export type CashSession = {
  id: string; number: string; openedAt: string; openedBy: CashActor; opening: number;
  movements: CashMovement[];
  closedAt?: string; closedBy?: CashActor; counted?: number; difference?: number; notes?: string;
  snapshot?: CashSummary;
};
export function cashSummary(session: CashSession, receipts: Receipt[]): CashSummary {
  if (session.snapshot) return session.snapshot;
  const included = receipts.filter(receipt => receipt.cashSessionId === session.id && receipt.status === "Registrado");
  const methods = new Map<string, number>();
  for (const receipt of included) for (const payment of receipt.payments) methods.set(payment.method, money((methods.get(payment.method) ?? 0) + payment.amount));
  const byMethod = [...methods].map(([method, amount]) => ({ method, amount }));
  const cashCollected = money(byMethod.filter(row => row.method.trim().toLocaleLowerCase("es-AR") === "efectivo").reduce((sum, row) => sum + row.amount, 0));
  const income = money(session.movements.filter(row => row.kind === "Ingreso").reduce((sum, row) => sum + row.amount, 0));
  const expense = money(session.movements.filter(row => row.kind === "Egreso").reduce((sum, row) => sum + row.amount, 0));
  return { receipts: included, byMethod, collected: money(included.reduce((sum, receipt) => sum + receipt.total, 0)), cashCollected, income, expense, expected: money(session.opening + cashCollected + income - expense) };
}
export function openCash(sessions: CashSession[]) {
  const session = sessions.find(row => !row.closedAt);
  if (!session) throw new Error("Abrí una caja en Ventas → Caja antes de registrar un cobro o una seña.");
  return session;
}
export function cashReceiptFields(sessions: CashSession[], actor?: CashActor) {
  const session = openCash(sessions);
  return { cashSessionId: session.id, registeredAt: new Date().toISOString(), registeredBy: actor ?? session.openedBy };
}
