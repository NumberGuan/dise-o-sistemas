import { createContext, useContext } from "react";
import type { Catalogs, CatalogKey } from "~/data/catalogs";
import { catalogOptions } from "~/data/catalogs";

export const CatalogContext = createContext<Catalogs | null>(null);
export function useCatalogs() {
  const catalogs = useContext(CatalogContext);
  if (!catalogs) throw new Error("Los catálogos deben cargarse antes de mostrar esta pantalla.");
  return catalogs;
}

export function CatalogOptions({ catalog, retained }: { catalog: CatalogKey; retained?: string }) {
  const catalogs = useCatalogs();
  return catalogOptions(catalogs, catalog, retained).map(item => <option key={item.id} value={item.value}>{item.name}{!item.active ? " (inactivo)" : ""}</option>);
}

export function useProductionCatalogs() {
  const catalogs = useCatalogs();
  const label = (key: CatalogKey, id: number) => catalogs[key].find(item => item.id === String(id))?.name ?? "—";
  const getUnidad = (id: number) => label("unidades", id);
  return {
    catalogs,
    UNIDADES: catalogs.unidades.map(item => ({ idUnidad: Number(item.id), unidad: item.name, active: item.active })),
    TIPOS_PRODUCTO: catalogs["tipos-producto"].map(item => ({ idTipoProducto: Number(item.id), tipo: item.name, active: item.active })),
    TIPOS_MATERIA_PRIMA: catalogs["tipos-materia-prima"].map(item => ({ idTipoMateriaPrima: Number(item.id), nombre: item.name, active: item.active })),
    MARCAS: catalogs.marcas.map(item => ({ idMarca: Number(item.id), nombre: item.name, active: item.active })),
    getUnidad,
    getTipoProducto: (id: number) => label("tipos-producto", id),
    getTipoMateriaPrima: (id: number) => label("tipos-materia-prima", id),
    getMarca: (id: number) => label("marcas", id),
    formatCantidad: (quantity: number, id: number) => `${quantity.toLocaleString("es-AR")} ${getUnidad(id)}`,
  };
}
