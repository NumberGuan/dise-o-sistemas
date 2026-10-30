import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { formatClientAddress, type Client } from "~/data/sales";
import "./print-voucher.css";

type Voucher = {
  number: string;
  date: string;
  status?: string;
  observations?: string;
  subtotal?: number;
  discount?: number;
  tax?: number;
  total?: number;
  items?: { productName: string; quantity: number; unitPrice?: number; subtotal?: number; expirationDate?: string }[];
};
type Props = {
  title: string;
  document: Voucher;
  client?: Client;
  recipient?: string;
  details?: { label: string; value: string }[];
  payments?: { method: string; reference?: string; amount: number }[];
  totalLabel?: string;
  signature?: boolean;
};
const money = (amount: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(amount);
const dateLabel = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.split("-").reverse().join("/") : value;

export default function PrintVoucher({ title, document: voucher, client, recipient, details = [], payments, totalLabel = "Total", signature = false }: Props) {
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);
  return <>
    <button type="button" disabled={!ready} onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 disabled:opacity-50">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M6 9V3h12v6M6 18H3v-8h18v8h-3M6 14h12v7H6zM17 11h1" /></svg>
      Imprimir comprobante
    </button>
    {ready && createPortal(<article data-print-voucher="true" className="print-voucher">
      <header className="voucher-header"><div><p className="voucher-eyebrow">FÁBRICA DE PASTAS</p><h1>{title}</h1><p>Documento comercial · copia para el cliente</p></div><div className="voucher-number"><strong>N.º {voucher.number}</strong><p>Fecha: {dateLabel(voucher.date)}</p>{voucher.status && <p>Estado: <strong>{voucher.status}</strong></p>}</div></header>
      <section className="voucher-recipient"><h2>Datos del destinatario</h2><strong>{client?.name ?? recipient ?? "Destinatario no registrado"}</strong>{client && <><p>{client.documentType}: {client.cuitCuil || "Sin informar"} · IVA: {client.ivaType || "Sin informar"}</p><p>Domicilio: {formatClientAddress(client) || "Sin informar"}</p>{client.email && <p>Correo: {client.email}</p>}</>}</section>
      {details.length > 0 && <dl className="voucher-references">{details.map((detail, index) => <div key={index}><dt>{detail.label}</dt><dd>{detail.value || "—"}</dd></div>)}</dl>}
      {voucher.items && <table><thead><tr><th>Descripción</th><th className="numeric">Cantidad</th>{voucher.items.some(item => item.unitPrice !== undefined) && <><th className="numeric">Precio unitario</th><th className="numeric">Importe</th></>}</tr></thead><tbody>{voucher.items.map((item, index) => <tr key={index}><td>{item.productName}{item.expirationDate && <small>Vencimiento: {dateLabel(item.expirationDate)}</small>}</td><td className="numeric">{item.quantity.toLocaleString("es-AR")}</td>{voucher.items!.some(line => line.unitPrice !== undefined) && <><td className="numeric">{item.unitPrice === undefined ? "—" : money(item.unitPrice)}</td><td className="numeric">{item.subtotal === undefined ? "—" : money(item.subtotal)}</td></>}</tr>)}</tbody></table>}
      {payments && <table><thead><tr><th>Medio de pago</th><th>Referencia</th><th className="numeric">Importe</th></tr></thead><tbody>{payments.map((payment, index) => <tr key={index}><td>{payment.method}</td><td>{payment.reference || "—"}</td><td className="numeric">{money(payment.amount)}</td></tr>)}</tbody></table>}
      {voucher.total !== undefined && <dl className="voucher-totals">{voucher.subtotal !== undefined && <div><dt>Subtotal</dt><dd>{money(voucher.subtotal)}</dd></div>}{voucher.discount !== undefined && <div><dt>Descuento</dt><dd>{money(voucher.discount)}</dd></div>}{voucher.tax !== undefined && <div><dt>IVA</dt><dd>{money(voucher.tax)}</dd></div>}<div className="voucher-grand-total"><dt>{totalLabel} (ARS)</dt><dd>{money(voucher.total)}</dd></div></dl>}
      {voucher.observations && <section className="voucher-observations"><h2>Observaciones</h2><p>{voucher.observations}</p></section>}
      {signature && <div className="voucher-signatures"><p>Firma y aclaración del emisor</p><p>Firma y aclaración del receptor</p></div>}
      <footer>Representación del comprobante registrado en el sistema. No acredita autorización fiscal.</footer>
    </article>, window.document.body)}
  </>;
}
