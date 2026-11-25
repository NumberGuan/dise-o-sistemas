import { useInternalData } from "~/components/InternalDataProvider";
import type { ComponentProps } from "react";
import { EMPRESA, formatearCUIT } from "~/data/facturacion-proveedores";
import { TIPOS_DOCUMENTO, type Proveedor } from "~/data/proveedores";
import SalesDocument from "./SalesDocument";

type Props = Omit<ComponentProps<typeof SalesDocument>, "moduleLabel" | "client" | "issuer" | "recipient" | "recipientLines" | "recipientLabel"> & {
  supplier?: Proveedor;
  issuedBySupplier?: boolean;
};

export default function PurchaseDocument({ supplier, issuedBySupplier = true, ...document }: Props) {
  const { getDomicilioPorId } = useInternalData("purchases");
  const address = supplier ? getDomicilioPorId(supplier.idDomicilio) : undefined;
  const supplierLines = supplier ? [
    `${TIPOS_DOCUMENTO.find(type => type.id === supplier.idTipoDocumento)?.nombre ?? "Documento"}: ${supplier.idTipoDocumento === 1 ? formatearCUIT(supplier.nroDocumento) : supplier.nroDocumento}`,
    address ? [
      `${address.calle} ${address.altura}`,
      address.piso ? `Piso ${address.piso}` : "",
      address.departamento ? `Depto. ${address.departamento}` : "",
      address.localidad, address.provincia,
    ].filter(Boolean).join(", ") : "Domicilio sin informar",
    ...(supplier.email ? [`Correo: ${supplier.email}`] : []),
  ] : ["Datos del proveedor no disponibles"];
  const companyLines = [`CUIT: ${EMPRESA.cuit} · ${EMPRESA.condicionIVA}`, EMPRESA.domicilio];

  return <SalesDocument {...document} moduleLabel="Compras"
    issuer={issuedBySupplier ? { name: supplier?.nombre ?? "Proveedor no registrado", lines: supplierLines } : { name: EMPRESA.razonSocial, lines: companyLines }}
    recipient={issuedBySupplier ? EMPRESA.razonSocial : supplier?.nombre ?? "Proveedor no registrado"}
    recipientLines={issuedBySupplier ? companyLines : supplierLines}
    recipientLabel={issuedBySupplier ? "Datos del receptor" : "Datos del proveedor"}
  />;
}
