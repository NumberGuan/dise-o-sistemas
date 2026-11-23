import type { ReactNode } from "react";
import BackToListButton from "./BackToListButton";
import { EMPRESA } from "~/data/facturacion-proveedores";
import "./production-document.css";

type Props = {
  moduleLabel?: string;
  title: string;
  name: string;
  code: string;
  status?: string;
  metadata: { label: string; value: ReactNode }[];
  onClose: () => void;
  actions?: ReactNode;
  controls?: ReactNode;
  controlsLabel?: string;
  children: ReactNode;
};

export default function ProductionDocument({ title, name, code, status, metadata, onClose, actions, controls, children, moduleLabel = "Producción", controlsLabel = "Gestión de la orden" }: Props) {
  return <div className="production-document-page mx-auto max-w-5xl px-4 py-8 text-gray-900 sm:px-6 lg:px-8">
    <div className="production-document-toolbar">
      <p className="text-sm font-medium text-gray-500">{moduleLabel} / {title}</p>
      <div className="flex flex-wrap items-center gap-2">{actions}<BackToListButton onClick={onClose} /></div>
    </div>
    <article className="production-document" aria-label={`${title}: ${name}`}>
      <header className="production-document-header">
        <div><p className="production-document-issuer">{EMPRESA.razonSocial}</p><p className="production-document-type">Departamento de {moduleLabel.toLocaleLowerCase("es-AR")} · {title}</p><h1>{name}</h1></div>
        <dl className="production-document-code"><div><dt>Código de registro</dt><dd>{code}</dd></div>{status && <div><dt>Estado</dt><dd>{status}</dd></div>}</dl>
      </header>
      <dl className="production-document-metadata">{metadata.map(item => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl>
      {children}
      <footer>Documento interno de {moduleLabel.toLocaleLowerCase("es-AR")} · {code}<span>Información registrada en el sistema de gestión.</span></footer>
    </article>
    {controls && <section className="production-document-controls" aria-label={controlsLabel}>{controls}</section>}
  </div>;
}

export function ProductionSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="production-document-section"><h2>{title}</h2>{children}</section>;
}

export const productionDate = (date: string | null) => date ? date.split("-").reverse().join("/") : "Sin registrar";
