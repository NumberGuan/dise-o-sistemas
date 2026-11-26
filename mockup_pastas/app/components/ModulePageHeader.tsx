import type { ReactNode } from "react";
import { useLocation } from "react-router";

const moduleImages: Readonly<Partial<Record<string, string>>> = {
  "": "/hero-pastas.jpg",
  ventas: "/module-headers/ventas.jpg",
  compras: "/module-headers/compras.jpg",
  produccion: "/module-headers/produccion.jpg",
  administracion: "/module-headers/administracion.jpg",
  mantenimiento: "/module-headers/mantenimiento.jpg",
};

export default function ModulePageHeader({ children, className, labelledBy }: {
  children: ReactNode;
  className?: string;
  labelledBy?: string;
}) {
  const { pathname } = useLocation();
  const modulePath = pathname.split("/")[1].toLowerCase();
  const image = Object.hasOwn(moduleImages, modulePath) ? moduleImages[modulePath] : undefined;

  return (
    <header
      className={className ? `module-page-header ${className}` : "module-page-header"}
      aria-labelledby={labelledBy}
    >
      {image && <img className="module-page-header-image" src={image} alt="" />}
      {children}
    </header>
  );
}
